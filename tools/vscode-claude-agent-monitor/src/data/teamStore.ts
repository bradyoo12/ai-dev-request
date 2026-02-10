import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { TeamConfig, AgentTask, InboxMessage, TeamState } from '../types';
import { getTeamsDir, getTasksDir, getTeamConfigPath, getTeamTasksDir, getTeamInboxDir } from '../utils/paths';

export class TeamStore implements vscode.Disposable {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  getTeamNames(): string[] {
    const teamsDir = getTeamsDir();
    if (!fs.existsSync(teamsDir)) {
      return [];
    }
    try {
      return fs.readdirSync(teamsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    } catch {
      return [];
    }
  }

  getTeamConfig(teamName: string): TeamConfig | undefined {
    return this.readJson<TeamConfig>(getTeamConfigPath(teamName));
  }

  getTeamTasks(teamName: string): AgentTask[] {
    const dir = getTeamTasksDir(teamName);
    if (!fs.existsSync(dir)) {
      return [];
    }
    try {
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => this.readJson<AgentTask>(path.join(dir, f)))
        .filter((t): t is AgentTask => t !== undefined)
        .sort((a, b) => Number(a.id) - Number(b.id));
    } catch {
      return [];
    }
  }

  getTeamInboxes(teamName: string): Map<string, InboxMessage[]> {
    const result = new Map<string, InboxMessage[]>();
    const dir = getTeamInboxDir(teamName);
    if (!fs.existsSync(dir)) {
      return result;
    }
    try {
      for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
        const agentName = path.basename(file, '.json');
        const messages = this.readJson<InboxMessage[]>(path.join(dir, file));
        if (messages && messages.length > 0) {
          result.set(agentName, messages);
        }
      }
    } catch {
      // ignore read errors
    }
    return result;
  }

  getTeamState(teamName: string): TeamState | undefined {
    const config = this.getTeamConfig(teamName);
    if (!config) { return undefined; }
    return {
      config,
      tasks: this.getTeamTasks(teamName),
      inboxes: this.getTeamInboxes(teamName),
    };
  }

  notifyChange(): void {
    this._onDidChange.fire();
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  private readJson<T>(filePath: string): T | undefined {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }
}
