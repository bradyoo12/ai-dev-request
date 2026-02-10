import * as os from 'os';
import * as path from 'path';

export function getClaudeDir(): string {
  return path.join(os.homedir(), '.claude');
}

export function getTeamsDir(): string {
  return path.join(getClaudeDir(), 'teams');
}

export function getTasksDir(): string {
  return path.join(getClaudeDir(), 'tasks');
}

export function getTeamConfigPath(teamName: string): string {
  return path.join(getTeamsDir(), teamName, 'config.json');
}

export function getTeamTasksDir(teamName: string): string {
  return path.join(getTasksDir(), teamName);
}

export function getTeamInboxDir(teamName: string): string {
  return path.join(getTeamsDir(), teamName, 'inboxes');
}
