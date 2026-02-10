import * as vscode from 'vscode';
import { TeamStore } from './data/teamStore';
import { AgentFileWatcher } from './data/fileWatcher';
import { AgentTreeProvider } from './views/agentTreeProvider';
import { DetailPanelProvider } from './views/detailPanel';
import { AgentStatusBar } from './statusBar';
import { TreeNodeContext } from './types';

export function activate(context: vscode.ExtensionContext): void {
  const store = new TeamStore();
  const watcher = new AgentFileWatcher(store);
  const treeProvider = new AgentTreeProvider(store);
  const detailProvider = new DetailPanelProvider();
  const statusBar = new AgentStatusBar(store);

  const treeView = vscode.window.createTreeView('claudeAgentMonitor.teamsView', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });

  const refreshCmd = vscode.commands.registerCommand(
    'claudeAgentMonitor.refresh',
    () => treeProvider.refresh(),
  );

  const detailCmd = vscode.commands.registerCommand(
    'claudeAgentMonitor.showDetail',
    (ctx: TreeNodeContext) => detailProvider.show(ctx),
  );

  watcher.start();

  context.subscriptions.push(
    treeView,
    refreshCmd,
    detailCmd,
    watcher,
    store,
    statusBar,
    treeProvider,
    detailProvider,
  );
}

export function deactivate(): void {
  // All disposables cleaned up via subscriptions
}
