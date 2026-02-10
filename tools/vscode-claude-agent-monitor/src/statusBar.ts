import * as vscode from 'vscode';
import { TeamStore } from './data/teamStore';

export class AgentStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private subscription: vscode.Disposable;

  constructor(private store: TeamStore) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
    this.item.command = 'claudeAgentMonitor.teamsView.focus';
    this.update();
    this.subscription = store.onDidChange(() => this.update());
  }

  private update(): void {
    const teams = this.store.getTeamNames();
    if (teams.length === 0) {
      this.item.hide();
      return;
    }

    let activeTaskCount = 0;
    for (const name of teams) {
      const tasks = this.store.getTeamTasks(name);
      activeTaskCount += tasks.filter(t => t.status === 'in_progress').length;
    }

    this.item.text = `$(organization) ${teams.length} team${teams.length !== 1 ? 's' : ''}`;
    this.item.tooltip = `${teams.length} active team(s), ${activeTaskCount} task(s) in progress\nClick to open Agent Monitor`;
    this.item.show();
  }

  dispose(): void {
    this.subscription.dispose();
    this.item.dispose();
  }
}
