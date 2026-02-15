import * as vscode from 'vscode';
import { AutoPilotState } from '../types';
import { ConfigManager } from '../config/configManager';

export class AutoPilotStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private enabled: boolean;
  private responseCount = 0;
  private state: AutoPilotState = 'idle';
  private subscription: vscode.Disposable;

  constructor(private config: ConfigManager) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'claudeAutoPilot.toggleAutoPilot';
    this.enabled = config.getConfig().enabled;
    this.update();
    this.item.show();

    this.subscription = config.onDidChange((cfg) => {
      this.enabled = cfg.enabled;
      this.update();
    });
  }

  setState(state: AutoPilotState): void {
    this.state = state;
    this.update();
  }

  incrementResponseCount(): void {
    this.responseCount++;
    this.update();
  }

  private update(): void {
    if (!this.enabled) {
      this.item.text = '$(circle-slash) Auto-Pilot OFF';
      this.item.backgroundColor = undefined;
      this.item.tooltip = 'Claude Auto-Pilot is disabled. Click to enable.';
    } else if (this.state === 'responding') {
      this.item.text = `$(loading~spin) Auto-Pilot (${this.responseCount})`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.item.tooltip = 'Auto-responding to Claude CLI prompt...';
    } else if (this.state === 'prompt_detected') {
      this.item.text = `$(zap) Auto-Pilot (${this.responseCount})`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.item.tooltip = 'Prompt detected, preparing response...';
    } else {
      this.item.text = `$(check) Auto-Pilot ON (${this.responseCount})`;
      this.item.backgroundColor = undefined;
      this.item.tooltip = `Claude Auto-Pilot is active. ${this.responseCount} response(s) this session.\nClick to toggle.`;
    }
  }

  dispose(): void {
    this.subscription.dispose();
    this.item.dispose();
  }
}
