export interface TeamConfig {
  name: string;
  description: string;
  createdAt: number;
  leadAgentId: string;
  leadSessionId: string;
  members: TeamMember[];
}

export interface TeamMember {
  agentId: string;
  name: string;
  agentType: string;
  model: string;
  joinedAt: number;
  cwd?: string;
  color?: string;
  tmuxPaneId?: string;
  backendType?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface AgentTask {
  id: string;
  subject: string;
  description: string;
  status: TaskStatus;
  owner?: string;
  blocks: string[];
  blockedBy: string[];
}

export interface InboxMessage {
  from: string;
  text: string;
  summary?: string;
  timestamp: string;
  color?: string;
  read: boolean;
}

export interface TeamState {
  config: TeamConfig;
  tasks: AgentTask[];
  inboxes: Map<string, InboxMessage[]>;
}

export type TreeNodeKind =
  | 'team'
  | 'members-group'
  | 'member'
  | 'tasks-group'
  | 'task'
  | 'messages-group'
  | 'message';

export interface TreeNodeContext {
  kind: TreeNodeKind;
  teamName: string;
  data?: TeamMember | AgentTask | InboxMessage;
}
