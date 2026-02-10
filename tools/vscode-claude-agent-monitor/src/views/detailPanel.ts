import * as vscode from 'vscode';
import { TreeNodeContext, TeamMember, AgentTask, InboxMessage } from '../types';

export class DetailPanelProvider implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;

  show(context: TreeNodeContext): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'claudeAgentDetail',
        'Agent Detail',
        vscode.ViewColumn.Beside,
        { enableScripts: false },
      );
      this.panel.onDidDispose(() => { this.panel = undefined; });
    }

    this.panel.title = this.getTitle(context);
    this.panel.webview.html = this.getHtml(context);
  }

  private getTitle(ctx: TreeNodeContext): string {
    switch (ctx.kind) {
      case 'member': return `Agent: ${(ctx.data as TeamMember).name}`;
      case 'task': return `Task #${(ctx.data as AgentTask).id}`;
      case 'message': return `Message: ${(ctx.data as InboxMessage).summary ?? 'Detail'}`;
      default: return 'Detail';
    }
  }

  private getHtml(ctx: TreeNodeContext): string {
    const body = this.renderBody(ctx);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.6;
    }
    h1 { font-size: 1.4em; margin-bottom: 8px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
    h2 { font-size: 1.1em; color: var(--vscode-descriptionForeground); margin-top: 16px; }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge-pending { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
    .badge-in_progress { background: var(--vscode-inputValidation-warningBackground); color: var(--vscode-inputValidation-warningForeground); }
    .badge-completed { background: var(--vscode-testing-iconPassed); color: #000; }
    .field { margin: 6px 0; }
    .field-label { font-weight: 600; color: var(--vscode-descriptionForeground); margin-right: 6px; }
    pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 6px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.9em;
      max-height: 400px;
      overflow-y: auto;
    }
    code { background: var(--vscode-textCodeBlock-background); padding: 1px 4px; border-radius: 3px; }
    .deps { margin-top: 8px; }
    .deps span { margin-right: 8px; }
  </style>
</head>
<body>${body}</body>
</html>`;
  }

  private renderBody(ctx: TreeNodeContext): string {
    switch (ctx.kind) {
      case 'member': return this.renderMember(ctx.data as TeamMember, ctx.teamName);
      case 'task': return this.renderTask(ctx.data as AgentTask);
      case 'message': return this.renderMessage(ctx.data as InboxMessage);
      default: return '<p>Select an item to see details.</p>';
    }
  }

  private renderMember(m: TeamMember, teamName: string): string {
    return `
      <h1>${this.esc(m.name)}</h1>
      <div class="field"><span class="field-label">Team:</span> ${this.esc(teamName)}</div>
      <div class="field"><span class="field-label">Type:</span> ${this.esc(m.agentType)}</div>
      <div class="field"><span class="field-label">Model:</span> ${this.esc(m.model)}</div>
      <div class="field"><span class="field-label">Agent ID:</span> <code>${this.esc(m.agentId)}</code></div>
      <div class="field"><span class="field-label">Joined:</span> ${new Date(m.joinedAt).toLocaleString()}</div>
      ${m.cwd ? `<div class="field"><span class="field-label">Working Dir:</span> <code>${this.esc(m.cwd)}</code></div>` : ''}
      ${m.color ? `<div class="field"><span class="field-label">Color:</span> ${this.esc(m.color)}</div>` : ''}
      ${m.backendType ? `<div class="field"><span class="field-label">Backend:</span> ${this.esc(m.backendType)}</div>` : ''}
    `;
  }

  private renderTask(t: AgentTask): string {
    return `
      <h1>#${this.esc(t.id)} ${this.esc(t.subject)}</h1>
      <span class="badge badge-${t.status}">${t.status.replace('_', ' ')}</span>
      ${t.owner ? `<div class="field"><span class="field-label">Owner:</span> ${this.esc(t.owner)}</div>` : ''}
      <h2>Description</h2>
      <pre>${this.esc(t.description)}</pre>
      ${t.blockedBy.length > 0 ? `<div class="deps"><span class="field-label">Blocked by:</span> ${t.blockedBy.map(b => '#' + this.esc(b)).join(', ')}</div>` : ''}
      ${t.blocks.length > 0 ? `<div class="deps"><span class="field-label">Blocks:</span> ${t.blocks.map(b => '#' + this.esc(b)).join(', ')}</div>` : ''}
    `;
  }

  private renderMessage(m: InboxMessage): string {
    return `
      <h1>${this.esc(m.summary ?? 'Message')}</h1>
      <div class="field"><span class="field-label">From:</span> ${this.esc(m.from)}</div>
      <div class="field"><span class="field-label">Time:</span> ${new Date(m.timestamp).toLocaleString()}</div>
      <div class="field"><span class="field-label">Read:</span> ${m.read ? 'Yes' : 'No'}</div>
      <h2>Content</h2>
      <pre>${this.esc(m.text)}</pre>
    `;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  dispose(): void {
    this.panel?.dispose();
  }
}
