import * as vscode from 'vscode';
import { findClaudeBinary } from '../utils/claudeBinary';

// node-pty types (loaded dynamically to avoid native module issues)
interface IPty {
  onData: (callback: (data: string) => void) => { dispose: () => void };
  onExit: (
    callback: (e: { exitCode: number; signal?: number }) => void,
  ) => { dispose: () => void };
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

export class ClaudeProcessManager implements vscode.Disposable {
  private readonly _onOutputReceived = new vscode.EventEmitter<string>();
  readonly onOutputReceived = this._onOutputReceived.event;

  private readonly _onProcessExited = new vscode.EventEmitter<number>();
  readonly onProcessExited = this._onProcessExited.event;

  private ptyProcess: IPty | undefined;
  private disposables: vscode.Disposable[] = [];
  private running = false;

  /** Start the Claude CLI process in the background */
  start(cwd: string): void {
    if (this.running) {
      return;
    }

    let claudeBinary: string;
    try {
      claudeBinary = findClaudeBinary();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onOutputReceived.fire(`Error: ${msg}\n`);
      this._onProcessExited.fire(1);
      return;
    }

    let nodePty: NodePtyModule;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      nodePty = require('node-pty') as NodePtyModule;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onOutputReceived.fire(
        `Error: Failed to load node-pty. ${msg}\n`,
      );
      this._onProcessExited.fire(1);
      return;
    }

    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
    };

    try {
      this.ptyProcess = nodePty.spawn(claudeBinary, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 40,
        cwd,
        env,
      });
      this.running = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._onOutputReceived.fire(`Error spawning Claude CLI: ${msg}\n`);
      this._onProcessExited.fire(1);
      return;
    }

    // Forward output
    const dataDisposable = this.ptyProcess.onData((data: string) => {
      this._onOutputReceived.fire(data);
    });
    this.disposables.push({ dispose: () => dataDisposable.dispose() });

    // Handle exit
    const exitDisposable = this.ptyProcess.onExit(
      (e: { exitCode: number; signal?: number }) => {
        this.running = false;
        this.ptyProcess = undefined;
        this._onProcessExited.fire(e.exitCode);
      },
    );
    this.disposables.push({ dispose: () => exitDisposable.dispose() });
  }

  /** Send input text to the Claude CLI stdin */
  sendInput(text: string): void {
    if (!this.ptyProcess) {
      return;
    }
    this.ptyProcess.write(text);
  }

  /** Stop the Claude CLI process */
  stop(): void {
    if (!this.ptyProcess) {
      return;
    }
    try {
      this.ptyProcess.kill();
    } catch {
      // Process may already be dead
    }
    this.running = false;
    this.ptyProcess = undefined;
  }

  /** Check if the process is currently running */
  isRunning(): boolean {
    return this.running;
  }

  dispose(): void {
    this.stop();
    this._onOutputReceived.dispose();
    this._onProcessExited.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
