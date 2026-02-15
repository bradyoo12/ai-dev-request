import * as vscode from 'vscode';
import { ConfigManager } from '../config/configManager';
import { PromptDetector } from '../detection/promptDetector';
import { AutoResponder } from '../responder/autoResponder';
import { ResponseLog } from '../logging/responseLog';
import { AutoPilotStatusBar } from '../ui/statusBar';
import { findClaudeBinary } from '../utils/claudeBinary';
import { AutoPilotState, PromptContext } from '../types';

// node-pty types (loaded dynamically)
interface IPty {
  onData: (callback: (data: string) => void) => { dispose: () => void };
  onExit: (callback: (e: { exitCode: number; signal?: number }) => void) => { dispose: () => void };
  write: (data: string) => void;
  resize: (columns: number, rows: number) => void;
  kill: (signal?: string) => void;
  pid: number;
}

interface IPtySpawnOptions {
  name?: string;
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: Record<string, string>;
  useConpty?: boolean;
}

interface NodePtyModule {
  spawn: (
    file: string,
    args: string[],
    options: IPtySpawnOptions,
  ) => IPty;
}

export class ClaudePtyTerminal implements vscode.Pseudoterminal, vscode.Disposable {
  // VS Code Pseudoterminal events
  private readonly _onDidWrite = new vscode.EventEmitter<string>();
  readonly onDidWrite = this._onDidWrite.event;
  private readonly _onDidClose = new vscode.EventEmitter<number | void>();
  readonly onDidClose = this._onDidClose.event;

  // Internal components
  private readonly promptDetector: PromptDetector;
  private readonly autoResponder: AutoResponder;
  private ptyProcess: IPty | undefined;
  private manualOverride = false;
  private pauseNext = false;
  private disposables: vscode.Disposable[] = [];
  private isResponding = false;

  constructor(
    private config: ConfigManager,
    private responseLog: ResponseLog,
    private statusBar: AutoPilotStatusBar,
  ) {
    this.promptDetector = new PromptDetector(config);
    this.autoResponder = new AutoResponder(config);

    // Wire prompt detection to auto-response
    this.disposables.push(
      this.promptDetector.onPromptDetected((ctx) => this.handlePromptDetected(ctx)),
    );

    // Wire state changes to status bar
    this.disposables.push(
      this.promptDetector.onStateChanged((state) => this.statusBar.setState(state)),
    );

    // Update detector when config changes
    this.disposables.push(
      config.onDidChange((cfg) => {
        this.promptDetector.setEnabled(cfg.enabled);
        if (!cfg.apiKey) {
          this.autoResponder.resetClient();
        }
      }),
    );
  }

  /** Called when the VS Code terminal opens */
  open(initialDimensions: vscode.TerminalDimensions | undefined): void {
    const cols = initialDimensions?.columns ?? 120;
    const rows = initialDimensions?.rows ?? 40;

    let claudeBinary: string;
    try {
      claudeBinary = findClaudeBinary();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onDidWrite.fire(`\r\nError: ${msg}\r\n`);
      this._onDidClose.fire(1);
      return;
    }

    let nodePty: NodePtyModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodePty = require('node-pty') as NodePtyModule;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onDidWrite.fire(
        `\r\nError: Failed to load node-pty. Please ensure build tools are installed.\r\n${msg}\r\n`,
      );
      this._onDidClose.fire(1);
      return;
    }

    // Build environment with terminal support
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
    };

    // Determine working directory
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const cwd = workspaceFolder ?? process.cwd();

    this._onDidWrite.fire(`\x1b[36mClaude Auto-Pilot starting...\x1b[0m\r\n`);
    this._onDidWrite.fire(`\x1b[90mBinary: ${claudeBinary}\x1b[0m\r\n`);
    this._onDidWrite.fire(
      `\x1b[90mAuto-Pilot: ${this.config.getConfig().enabled ? 'ON' : 'OFF'}\x1b[0m\r\n\r\n`,
    );

    try {
      this.ptyProcess = nodePty.spawn(claudeBinary, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onDidWrite.fire(`\r\nError spawning Claude CLI: ${msg}\r\n`);
      this._onDidClose.fire(1);
      return;
    }

    // Forward pty output to terminal display and prompt detector
    const dataDisposable = this.ptyProcess.onData((data: string) => {
      this._onDidWrite.fire(data);
      this.promptDetector.feed(data);
    });
    this.disposables.push({ dispose: () => dataDisposable.dispose() });

    // Handle process exit
    const exitDisposable = this.ptyProcess.onExit(
      (e: { exitCode: number; signal?: number }) => {
        this._onDidWrite.fire(
          `\r\n\x1b[90mClaude CLI exited (code: ${e.exitCode})\x1b[0m\r\n`,
        );
        this._onDidClose.fire(e.exitCode);
      },
    );
    this.disposables.push({ dispose: () => exitDisposable.dispose() });
  }

  /** Called when user types in the terminal */
  handleInput(data: string): void {
    if (!this.ptyProcess) return;

    // Ctrl+C always passes through and resets state
    if (data === '\x03') {
      this.ptyProcess.write(data);
      this.manualOverride = false;
      this.isResponding = false;
      this.autoResponder.cancelPending();
      this.promptDetector.reset();
      return;
    }

    const cfg = this.config.getConfig();

    // If auto-pilot is off or manual override is active, pass through
    if (!cfg.enabled || this.manualOverride) {
      this.ptyProcess.write(data);
      // If user pressed Enter, resume auto-pilot
      if (data === '\r' || data === '\n') {
        this.manualOverride = false;
        this.promptDetector.reset();
      }
      return;
    }

    // If we're currently auto-responding and user starts typing, cancel and go manual
    if (this.isResponding) {
      this.autoResponder.cancelPending();
      this.isResponding = false;
      this.manualOverride = true;
      this.ptyProcess.write(data);
      this.statusBar.setState('idle');
      return;
    }

    // Normal pass-through (auto-pilot on but not in responding state)
    this.ptyProcess.write(data);
  }

  /** Resize the terminal */
  setDimensions(dimensions: vscode.TerminalDimensions): void {
    this.ptyProcess?.resize(dimensions.columns, dimensions.rows);
  }

  /** Called when the terminal is closed */
  close(): void {
    try {
      this.ptyProcess?.kill();
    } catch {
      // Process may already be dead
    }
  }

  /** Skip auto-response for the next detected prompt */
  pauseForNextPrompt(): void {
    this.pauseNext = true;
  }

  private async handlePromptDetected(context: PromptContext): Promise<void> {
    const cfg = this.config.getConfig();
    if (!cfg.enabled) return;

    // If pause-for-next is active, skip this one
    if (this.pauseNext) {
      this.pauseNext = false;
      this.promptDetector.reset();
      this._onDidWrite.fire(
        '\r\n\x1b[33m[Auto-Pilot paused for this prompt - type your response manually]\x1b[0m\r\n',
      );
      return;
    }

    this.isResponding = true;
    this.promptDetector.markResponding();
    this.statusBar.setState('responding');

    // Show indicator that auto-pilot is responding
    this._onDidWrite.fire('\x1b[36m[Auto-Pilot responding...]\x1b[0m');

    const result = await this.autoResponder.respond(context);
    this.responseLog.add(result);

    if (!this.isResponding) {
      // User took over during API call
      return;
    }

    this.isResponding = false;

    if (result.success && result.response && this.ptyProcess) {
      // Type the response into the terminal
      this.ptyProcess.write(result.response + '\r');
      this.statusBar.incrementResponseCount();
      this.promptDetector.reset();
    } else if (!result.success) {
      this._onDidWrite.fire(
        `\r\n\x1b[31m[Auto-Pilot error: ${result.error}]\x1b[0m\r\n`,
      );
      this.promptDetector.reset();
      // Let user respond manually on error
      this.manualOverride = true;
    }
  }

  dispose(): void {
    this.autoResponder.cancelPending();
    this.promptDetector.dispose();
    this.autoResponder.dispose();
    try {
      this.ptyProcess?.kill();
    } catch {
      // Ignore
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this._onDidWrite.dispose();
    this._onDidClose.dispose();
  }
}
