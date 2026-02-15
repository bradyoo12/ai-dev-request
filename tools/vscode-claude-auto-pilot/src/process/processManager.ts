import * as vscode from 'vscode';
import { ConfigManager } from '../config/configManager';
import { findClaudeBinary } from '../utils/claudeBinary';

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
  spawn: (file: string, args: string[], options: IPtySpawnOptions) => IPty;
}

/**
 * Manages the Claude CLI process lifecycle for the sidebar chat view.
 * Wraps node-pty to spawn and communicate with the Claude CLI binary.
 */
export class ProcessManager implements vscode.Disposable {
  private readonly _onData = new vscode.EventEmitter<string>();
  readonly onData = this._onData.event;

  private readonly _onExit = new vscode.EventEmitter<number>();
  readonly onExit = this._onExit.event;

  private readonly _onError = new vscode.EventEmitter<string>();
  readonly onError = this._onError.event;

  private ptyProcess: IPty | undefined;
  private disposables: vscode.Disposable[] = [];
  private running = false;

  constructor(private config: ConfigManager) {}

  /** Start the Claude CLI process */
  start(): void {
    if (this.running) return;

    let claudeBinary: string;
    try {
      claudeBinary = findClaudeBinary();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onError.fire(`Claude CLI not found: ${msg}`);
      return;
    }

    let nodePty: NodePtyModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodePty = require('node-pty') as NodePtyModule;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onError.fire(`Failed to load node-pty: ${msg}`);
      return;
    }

    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
    };

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const cwd = workspaceFolder ?? process.cwd();

    try {
      this.ptyProcess = nodePty.spawn(claudeBinary, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 40,
        cwd,
        env,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onError.fire(`Failed to spawn Claude CLI: ${msg}`);
      return;
    }

    this.running = true;

    const dataDisposable = this.ptyProcess.onData((data: string) => {
      this._onData.fire(data);
    });
    this.disposables.push({ dispose: () => dataDisposable.dispose() });

    const exitDisposable = this.ptyProcess.onExit((e: { exitCode: number; signal?: number }) => {
      this.running = false;
      this.ptyProcess = undefined;
      this._onExit.fire(e.exitCode);
    });
    this.disposables.push({ dispose: () => exitDisposable.dispose() });
  }

  /** Send text input to the Claude CLI process */
  sendInput(text: string): void {
    if (!this.ptyProcess) {
      this._onError.fire('No active Claude CLI process. Start a session first.');
      return;
    }
    this.ptyProcess.write(text);
  }

  /** Send text followed by Enter key */
  sendLine(text: string): void {
    this.sendInput(text + '\r');
  }

  /** Send Ctrl+C to the process */
  interrupt(): void {
    this.sendInput('\x03');
  }

  /** Check if process is currently running */
  isRunning(): boolean {
    return this.running;
  }

  /** Kill the process */
  stop(): void {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill();
      } catch {
        // Process may already be dead
      }
      this.running = false;
      this.ptyProcess = undefined;
    }
  }

  dispose(): void {
    this.stop();
    for (const d of this.disposables) {
      d.dispose();
    }
    this._onData.dispose();
    this._onExit.dispose();
    this._onError.dispose();
  }
}
