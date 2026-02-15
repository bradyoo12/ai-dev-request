import * as vscode from 'vscode';
import { AutoPilotState, PromptContext } from '../types';
import { ConfigManager } from '../config/configManager';
import { stripAnsi } from '../utils/stripAnsi';

const MAX_BUFFER_LINES = 100;
const RECENT_LINES_TO_CHECK = 15;
const CONFIRMATION_DELAY_MS = 300;

export class PromptDetector implements vscode.Disposable {
  private readonly _onPromptDetected = new vscode.EventEmitter<PromptContext>();
  readonly onPromptDetected = this._onPromptDetected.event;

  private readonly _onStateChanged = new vscode.EventEmitter<AutoPilotState>();
  readonly onStateChanged = this._onStateChanged.event;

  private buffer: string[] = [];
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private confirmTimer: ReturnType<typeof setTimeout> | undefined;
  private state: AutoPilotState = 'idle';
  private compiledPatterns: RegExp[] = [];
  private enabled = true;

  constructor(private config: ConfigManager) {
    this.compilePatterns();
    config.onDidChange(() => this.compilePatterns());
  }

  /** Feed raw terminal output data for analysis */
  feed(rawChunk: string): void {
    if (!this.enabled) return;

    const cleaned = stripAnsi(rawChunk);
    if (!cleaned.trim()) return;

    // Split into lines and add to rolling buffer
    const lines = cleaned.split(/\r?\n/);
    for (const line of lines) {
      if (line.length > 0) {
        this.buffer.push(line);
      }
    }

    // Trim buffer to max size
    if (this.buffer.length > MAX_BUFFER_LINES) {
      this.buffer = this.buffer.slice(-MAX_BUFFER_LINES);
    }

    // Reset idle timer - Claude is still outputting
    this.clearTimers();
    this.setState('claude_outputting');

    const cfg = this.config.getConfig();
    this.idleTimer = setTimeout(() => this.onIdleTimeout(), cfg.idleTimeoutMs);
  }

  /** Mark that a response is being sent */
  markResponding(): void {
    this.clearTimers();
    this.setState('responding');
  }

  /** Reset the detector to idle state */
  reset(): void {
    this.clearTimers();
    this.buffer = [];
    this.setState('idle');
  }

  /** Enable or disable detection */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearTimers();
      this.setState('idle');
    }
  }

  getState(): AutoPilotState {
    return this.state;
  }

  private onIdleTimeout(): void {
    this.idleTimer = undefined;
    this.setState('idle_detected');

    const match = this.checkPatterns();
    if (match) {
      // Confirmation window: wait a bit more to ensure Claude is truly done
      this.confirmTimer = setTimeout(() => {
        this.confirmTimer = undefined;
        if (this.state === 'idle_detected') {
          // Still idle after confirmation delay - confirmed prompt
          this.setState('prompt_detected');
          this._onPromptDetected.fire(match);
        }
        // If state changed during confirmation, new output arrived - abort
      }, CONFIRMATION_DELAY_MS);
    } else {
      // No pattern matched, go back to idle
      this.setState('idle');
    }
  }

  private checkPatterns(): PromptContext | undefined {
    const recentLines = this.buffer.slice(-RECENT_LINES_TO_CHECK);
    const recentOutput = recentLines.join('\n');

    for (const pattern of this.compiledPatterns) {
      for (const line of recentLines) {
        if (pattern.test(line)) {
          return {
            recentOutput,
            promptText: line.trim(),
            matchedPattern: pattern.source,
            detectedAt: Date.now(),
          };
        }
      }
    }

    return undefined;
  }

  private compilePatterns(): void {
    const cfg = this.config.getConfig();
    this.compiledPatterns = [];
    for (const pattern of cfg.promptPatterns) {
      try {
        this.compiledPatterns.push(new RegExp(pattern, 'i'));
      } catch {
        // Skip invalid regex patterns
      }
    }
  }

  private setState(state: AutoPilotState): void {
    if (this.state !== state) {
      this.state = state;
      this._onStateChanged.fire(state);
    }
  }

  private clearTimers(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
    if (this.confirmTimer !== undefined) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = undefined;
    }
  }

  dispose(): void {
    this.clearTimers();
    this._onPromptDetected.dispose();
    this._onStateChanged.dispose();
  }
}
