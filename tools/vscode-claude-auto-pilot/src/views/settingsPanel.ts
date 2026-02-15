import * as vscode from 'vscode';
import { AutoPilotConfig, WebviewMessage } from '../types';
import { ConfigManager } from '../config/configManager';
import { ResponseLog } from '../logging/responseLog';

export class SettingsPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private config: ConfigManager,
    private responseLog: ResponseLog,
  ) {}

  show(): void {
    if (this.panel) {
      this.panel.reveal();
      this.sendConfig();
      this.sendLog();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'claudeAutoPilotSettings',
      'Claude Auto-Pilot Settings',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => this.handleMessage(msg),
      undefined,
      this.disposables,
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      undefined,
      this.disposables,
    );

    // Push live updates
    this.disposables.push(
      this.config.onDidChange(() => this.sendConfig()),
      this.responseLog.onDidChange(() => this.sendLog()),
    );
  }

  private sendConfig(): void {
    this.panel?.webview.postMessage({
      type: 'configChanged',
      config: this.config.getConfig(),
    } as WebviewMessage);
  }

  private sendLog(): void {
    this.panel?.webview.postMessage({
      type: 'logUpdated',
      entries: this.responseLog.getEntries(),
    } as WebviewMessage);
  }

  private async handleMessage(msg: WebviewMessage): Promise<void> {
    switch (msg.type) {
      case 'getConfig':
        this.sendConfig();
        break;
      case 'updateConfig':
        await this.config.updateConfig(msg.config);
        break;
      case 'getLog':
        this.sendLog();
        break;
      case 'clearLog':
        this.responseLog.clear();
        break;
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Auto-Pilot Settings</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 1.4em;
      margin-bottom: 4px;
      color: var(--vscode-foreground);
    }
    h2 {
      font-size: 1.15em;
      margin-top: 24px;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
      border-bottom: 1px solid var(--vscode-widget-border);
      padding-bottom: 4px;
    }
    .subtitle {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 4px;
      font-weight: bold;
      color: var(--vscode-foreground);
    }
    .field {
      margin-bottom: 16px;
    }
    .field-description {
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }
    textarea, input[type="text"], input[type="password"], input[type="number"], select {
      width: 100%;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      border-radius: 2px;
    }
    textarea {
      min-height: 120px;
      resize: vertical;
    }
    input[type="range"] {
      width: 100%;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toggle {
      position: relative;
      width: 40px;
      height: 20px;
      cursor: pointer;
    }
    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      inset: 0;
      background: var(--vscode-input-border);
      border-radius: 10px;
      transition: background 0.2s;
    }
    .slider::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 2px;
      bottom: 2px;
      background: var(--vscode-foreground);
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle input:checked + .slider {
      background: var(--vscode-button-background);
    }
    .toggle input:checked + .slider::before {
      transform: translateX(20px);
    }
    button {
      padding: 6px 14px;
      border: none;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
      border-radius: 2px;
      font-size: var(--vscode-font-size);
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .log-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 0.9em;
    }
    .log-table th, .log-table td {
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }
    .log-table th {
      color: var(--vscode-descriptionForeground);
      font-weight: normal;
    }
    .log-table td.prompt {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .log-table td.response {
      font-family: var(--vscode-editor-font-family);
    }
    .badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 0.8em;
    }
    .badge.success {
      background: var(--vscode-testing-iconPassed);
      color: var(--vscode-editor-background);
    }
    .badge.error {
      background: var(--vscode-testing-iconFailed);
      color: var(--vscode-editor-background);
    }
    .empty-state {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      padding: 20px;
      text-align: center;
    }
    .range-value {
      display: inline-block;
      min-width: 50px;
      text-align: right;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <h1>Claude Auto-Pilot</h1>
  <p class="subtitle">Configure how the extension auto-responds to Claude CLI prompts</p>

  <div class="field">
    <div class="toggle-row">
      <label class="toggle">
        <input type="checkbox" id="enabled">
        <span class="slider"></span>
      </label>
      <span>Auto-Pilot Enabled</span>
    </div>
  </div>

  <h2>Instructions</h2>
  <div class="field">
    <label for="instructions">Auto-Response Instructions</label>
    <textarea id="instructions" placeholder="e.g., Approve all tool calls. Answer questions concisely. When asked about testing, say to run all tests."></textarea>
    <div class="field-description">
      Natural language instructions that guide how the AI responds to Claude CLI prompts.
      Be specific about what to approve, deny, or how to answer different types of questions.
    </div>
  </div>

  <h2>Configuration</h2>
  <div class="field">
    <label for="model">AI Model</label>
    <select id="model">
      <option value="haiku">Haiku (faster, cheaper)</option>
      <option value="sonnet">Sonnet (smarter, slower)</option>
    </select>
  </div>

  <div class="field">
    <label for="idleTimeout">
      Idle Timeout: <span class="range-value" id="idleTimeoutValue">1500ms</span>
    </label>
    <input type="range" id="idleTimeout" min="500" max="5000" step="100" value="1500">
    <div class="field-description">
      How long to wait (ms) after Claude stops outputting before checking for a prompt.
      Lower = faster response, higher = fewer false positives.
    </div>
  </div>

  <div class="field">
    <label for="apiKey">Anthropic API Key</label>
    <input type="password" id="apiKey" placeholder="sk-ant-...">
    <div class="field-description">
      Required for auto-responses. Can also be set via ANTHROPIC_API_KEY environment variable.
    </div>
  </div>

  <div class="actions">
    <button id="saveBtn">Save Settings</button>
  </div>

  <h2>Response Log</h2>
  <div class="actions">
    <button class="secondary" id="clearLogBtn">Clear Log</button>
  </div>
  <div id="logContainer">
    <div class="empty-state">No auto-responses yet</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Elements
    const enabledEl = document.getElementById('enabled');
    const instructionsEl = document.getElementById('instructions');
    const modelEl = document.getElementById('model');
    const idleTimeoutEl = document.getElementById('idleTimeout');
    const idleTimeoutValueEl = document.getElementById('idleTimeoutValue');
    const apiKeyEl = document.getElementById('apiKey');
    const saveBtnEl = document.getElementById('saveBtn');
    const clearLogBtnEl = document.getElementById('clearLogBtn');
    const logContainerEl = document.getElementById('logContainer');

    // Update timeout display
    idleTimeoutEl.addEventListener('input', () => {
      idleTimeoutValueEl.textContent = idleTimeoutEl.value + 'ms';
    });

    // Save button
    saveBtnEl.addEventListener('click', () => {
      vscode.postMessage({
        type: 'updateConfig',
        config: {
          enabled: enabledEl.checked,
          instructions: instructionsEl.value,
          model: modelEl.value,
          idleTimeoutMs: parseInt(idleTimeoutEl.value, 10),
          apiKey: apiKeyEl.value || undefined,
        }
      });
    });

    // Clear log
    clearLogBtnEl.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearLog' });
    });

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'configChanged':
          populateConfig(msg.config);
          break;
        case 'logUpdated':
          renderLog(msg.entries);
          break;
      }
    });

    function populateConfig(config) {
      enabledEl.checked = config.enabled;
      instructionsEl.value = config.instructions || '';
      modelEl.value = config.model || 'haiku';
      idleTimeoutEl.value = config.idleTimeoutMs || 1500;
      idleTimeoutValueEl.textContent = (config.idleTimeoutMs || 1500) + 'ms';
      if (config.apiKey) {
        apiKeyEl.value = config.apiKey;
      }
    }

    function renderLog(entries) {
      if (!entries || entries.length === 0) {
        logContainerEl.innerHTML = '<div class="empty-state">No auto-responses yet</div>';
        return;
      }

      const rows = entries.slice().reverse().map(entry => {
        const time = new Date(entry.respondedAt).toLocaleTimeString();
        const status = entry.success
          ? '<span class="badge success">OK</span>'
          : '<span class="badge error">ERR</span>';
        const prompt = escapeHtml(entry.prompt.promptText).substring(0, 60);
        const response = entry.success ? escapeHtml(entry.response) : escapeHtml(entry.error || 'Unknown error');
        return '<tr>'
          + '<td>' + time + '</td>'
          + '<td>' + status + '</td>'
          + '<td class="prompt" title="' + escapeHtml(entry.prompt.promptText) + '">' + prompt + '</td>'
          + '<td class="response">' + response + '</td>'
          + '<td>' + entry.latencyMs + 'ms</td>'
          + '</tr>';
      }).join('');

      logContainerEl.innerHTML = '<table class="log-table">'
        + '<thead><tr><th>Time</th><th>Status</th><th>Prompt</th><th>Response</th><th>Latency</th></tr></thead>'
        + '<tbody>' + rows + '</tbody>'
        + '</table>';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }

    // Request initial data
    vscode.postMessage({ type: 'getConfig' });
    vscode.postMessage({ type: 'getLog' });
  </script>
</body>
</html>`;
  }

  dispose(): void {
    this.panel?.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
