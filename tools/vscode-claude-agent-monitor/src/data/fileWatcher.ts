import * as vscode from 'vscode';
import { getTeamsDir, getTasksDir } from '../utils/paths';
import { TeamStore } from './teamStore';

export class AgentFileWatcher implements vscode.Disposable {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private store: TeamStore) {}

  start(): void {
    const teamsDir = getTeamsDir();
    const tasksDir = getTasksDir();

    // Watch team config files
    const teamConfigWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(teamsDir), '**/config.json')
    );

    // Watch task files
    const taskWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(tasksDir), '**/*.json')
    );

    // Watch inbox files
    const inboxWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(teamsDir), '**/inboxes/*.json')
    );

    const handler = () => this.debouncedNotify();

    for (const watcher of [teamConfigWatcher, taskWatcher, inboxWatcher]) {
      watcher.onDidChange(handler);
      watcher.onDidCreate(handler);
      watcher.onDidDelete(handler);
      this.watchers.push(watcher);
    }
  }

  private debouncedNotify(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.store.notifyChange();
    }, 300);
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    for (const w of this.watchers) {
      w.dispose();
    }
  }
}
