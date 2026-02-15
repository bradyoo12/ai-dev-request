import * as vscode from 'vscode';
import { AutoResponse } from '../types';
import { ConfigManager } from '../config/configManager';

export class ResponseLog implements vscode.Disposable {
  private readonly _onDidChange = new vscode.EventEmitter<AutoResponse[]>();
  readonly onDidChange = this._onDidChange.event;

  private entries: AutoResponse[] = [];
  private maxSize: number;

  constructor(config: ConfigManager) {
    this.maxSize = config.getConfig().maxResponseLogSize;
    config.onDidChange((cfg) => {
      this.maxSize = cfg.maxResponseLogSize;
    });
  }

  add(entry: AutoResponse): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxSize) {
      this.entries = this.entries.slice(-this.maxSize);
    }
    this._onDidChange.fire([...this.entries]);
  }

  getEntries(): AutoResponse[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this._onDidChange.fire([]);
  }

  dispose(): void {
    this._onDidChange.dispose();
  }
}
