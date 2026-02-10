import * as vscode from 'vscode';
import { TeamStore } from '../data/teamStore';
import { TeamConfig, TeamMember, AgentTask, InboxMessage, TreeNodeContext } from '../types';

type TreeNode = TeamNode | GroupNode | MemberNode | TaskNode | MessageNode;

class TeamNode extends vscode.TreeItem {
  readonly nodeType = 'team' as const;
  constructor(
    public readonly teamName: string,
    public readonly config: TeamConfig,
  ) {
    super(config.name, vscode.TreeItemCollapsibleState.Expanded);
    this.description = config.description;
    this.tooltip = `${config.members.length} members | Created ${new Date(config.createdAt).toLocaleString()}`;
    this.iconPath = new vscode.ThemeIcon('organization');
    this.contextValue = 'team';
  }
}

class GroupNode extends vscode.TreeItem {
  readonly nodeType = 'group' as const;
  constructor(
    label: string,
    public readonly teamName: string,
    public readonly groupType: 'members' | 'tasks' | 'messages',
    count: number,
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `(${count})`;
    const iconMap = { members: 'people', tasks: 'checklist', messages: 'mail' };
    this.iconPath = new vscode.ThemeIcon(iconMap[groupType]);
    this.contextValue = `${groupType}-group`;
  }
}

class MemberNode extends vscode.TreeItem {
  readonly nodeType = 'member' as const;
  constructor(
    public readonly teamName: string,
    public readonly member: TeamMember,
    isLead: boolean,
  ) {
    super(member.name, vscode.TreeItemCollapsibleState.None);
    this.description = `${member.agentType}${isLead ? ' (lead)' : ''}`;
    this.tooltip = `Model: ${member.model}\nJoined: ${new Date(member.joinedAt).toLocaleString()}`;
    const color = member.color ? new vscode.ThemeColor(`charts.${member.color}`) : undefined;
    this.iconPath = new vscode.ThemeIcon('account', color);
    this.contextValue = 'member';
    this.command = {
      command: 'claudeAgentMonitor.showDetail',
      title: 'Show Detail',
      arguments: [{ kind: 'member', teamName, data: member } as TreeNodeContext],
    };
  }
}

class TaskNode extends vscode.TreeItem {
  readonly nodeType = 'task' as const;
  constructor(
    public readonly teamName: string,
    public readonly task: AgentTask,
  ) {
    super(`#${task.id} ${task.subject}`, vscode.TreeItemCollapsibleState.None);
    this.description = task.owner ?? '';
    this.tooltip = task.description;
    const statusIcons: Record<string, string> = {
      pending: 'circle-outline',
      in_progress: 'loading~spin',
      completed: 'check',
    };
    const statusColors: Record<string, string> = {
      pending: 'list.deemphasizedForeground',
      in_progress: 'list.warningForeground',
      completed: 'testing.iconPassed',
    };
    this.iconPath = new vscode.ThemeIcon(
      statusIcons[task.status] ?? 'circle-outline',
      new vscode.ThemeColor(statusColors[task.status] ?? 'foreground'),
    );
    this.contextValue = 'task';
    this.command = {
      command: 'claudeAgentMonitor.showDetail',
      title: 'Show Detail',
      arguments: [{ kind: 'task', teamName, data: task } as TreeNodeContext],
    };
  }
}

class MessageNode extends vscode.TreeItem {
  readonly nodeType = 'message' as const;
  constructor(
    public readonly teamName: string,
    public readonly message: InboxMessage,
  ) {
    super(message.summary ?? message.from, vscode.TreeItemCollapsibleState.None);
    this.description = `from ${message.from}`;
    this.tooltip = message.text.substring(0, 200);
    this.iconPath = new vscode.ThemeIcon(
      message.read ? 'mail-read' : 'mail',
      message.read ? undefined : new vscode.ThemeColor('notificationsInfoIcon.foreground'),
    );
    this.contextValue = 'message';
    this.command = {
      command: 'claudeAgentMonitor.showDetail',
      title: 'Show Detail',
      arguments: [{ kind: 'message', teamName, data: message } as TreeNodeContext],
    };
  }
}

export class AgentTreeProvider implements vscode.TreeDataProvider<TreeNode>, vscode.Disposable {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private subscription: vscode.Disposable;

  constructor(private store: TeamStore) {
    this.subscription = store.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return this.store.getTeamNames()
        .map(name => {
          const config = this.store.getTeamConfig(name);
          if (!config) { return undefined; }
          return new TeamNode(name, config);
        })
        .filter((n): n is TeamNode => n !== undefined);
    }

    if (element instanceof TeamNode) {
      const state = this.store.getTeamState(element.teamName);
      if (!state) { return []; }
      const totalMessages = Array.from(state.inboxes.values())
        .reduce((sum, msgs) => sum + msgs.length, 0);
      return [
        new GroupNode('Members', element.teamName, 'members', state.config.members.length),
        new GroupNode('Tasks', element.teamName, 'tasks', state.tasks.length),
        new GroupNode('Messages', element.teamName, 'messages', totalMessages),
      ];
    }

    if (element instanceof GroupNode) {
      const state = this.store.getTeamState(element.teamName);
      if (!state) { return []; }
      switch (element.groupType) {
        case 'members':
          return state.config.members.map(m =>
            new MemberNode(element.teamName, m, m.agentId === state.config.leadAgentId),
          );
        case 'tasks': {
          const order: Record<string, number> = { in_progress: 0, pending: 1, completed: 2 };
          return [...state.tasks]
            .sort((a, b) => (order[a.status] ?? 1) - (order[b.status] ?? 1))
            .map(t => new TaskNode(element.teamName, t));
        }
        case 'messages':
          return Array.from(state.inboxes.values())
            .flat()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10)
            .map(m => new MessageNode(element.teamName, m));
      }
    }

    return [];
  }

  dispose(): void {
    this.subscription.dispose();
    this._onDidChangeTreeData.dispose();
  }
}
