import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AutoPilotConfig } from '../types';

const DEFAULT_PROMPT_PATTERNS: string[] = [
  // Claude CLI tool approval prompts
  'Allow\\s.*\\?',
  '\\(y\\s*=\\s*yes.*n\\s*=\\s*no',
  'Do you want to proceed\\?',
  'Press Enter to continue',
  // Yes/No prompt patterns
  '\\(y\\/n\\)',
  '\\(Y\\/N\\)',
  '\\[y\\/N\\]',
  '\\[Y\\/n\\]',
  // Generic question patterns (line ending with ?)
  '.{10,}\\?\\s*$',
];

function getDefaults(): AutoPilotConfig {
  return {
    enabled: true,
    instructions:
      'Approve all tool calls. Answer questions concisely. When asked about approach, prefer the simpler option.',
    idleTimeoutMs: 1500,
    model: 'haiku',
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    maxResponseLogSize: 100,
    promptPatterns: DEFAULT_PROMPT_PATTERNS,
    claudeBinaryPath: '',
  };
}

export class ConfigManager implements vscode.Disposable {
  private readonly _onDidChange = new vscode.EventEmitter<AutoPilotConfig>();
  readonly onDidChange = this._onDidChange.event;

  private config: AutoPilotConfig;
  private watcher: vscode.FileSystemWatcher | undefined;
  private settingsListener: vscode.Disposable | undefined;
  private readonly configPath: string;

  constructor() {
    this.configPath = path.join(os.homedir(), '.claude', 'auto-pilot', 'config.json');
    this.config = this.loadConfig();
    this.startWatching();
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeAutoPilot')) {
        this.config = this.loadConfig();
        this._onDidChange.fire(this.config);
      }
    });
  }

  getConfig(): AutoPilotConfig {
    return { ...this.config };
  }

  async updateConfig(partial: Partial<AutoPilotConfig>): Promise<void> {
    this.config = { ...this.config, ...partial };
    const dir = path.dirname(this.configPath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    this._onDidChange.fire(this.config);
  }

  private loadConfig(): AutoPilotConfig {
    const defaults = getDefaults();

    // Merge VS Code settings
    const vscodeSettings = vscode.workspace.getConfiguration('claudeAutoPilot');
    const merged: AutoPilotConfig = {
      ...defaults,
      enabled: vscodeSettings.get<boolean>('enabled', defaults.enabled),
      instructions: vscodeSettings.get<string>('defaultInstructions', defaults.instructions),
      idleTimeoutMs: vscodeSettings.get<number>('idleTimeoutMs', defaults.idleTimeoutMs),
      model: vscodeSettings.get<'haiku' | 'sonnet'>('model', defaults.model),
      apiKey: vscodeSettings.get<string>('apiKey', '') || defaults.apiKey,
      claudeBinaryPath: vscodeSettings.get<string>('claudeBinaryPath', ''),
    };

    // Override with config file if it exists
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const fileConfig = JSON.parse(raw) as Partial<AutoPilotConfig>;
        return { ...merged, ...fileConfig };
      }
    } catch {
      // Ignore parse errors, use merged defaults
    }

    return merged;
  }

  private startWatching(): void {
    const dir = path.dirname(this.configPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(vscode.Uri.file(dir), 'config.json'),
      );
      this.watcher.onDidChange(() => {
        this.config = this.loadConfig();
        this._onDidChange.fire(this.config);
      });
      this.watcher.onDidCreate(() => {
        this.config = this.loadConfig();
        this._onDidChange.fire(this.config);
      });
    } catch {
      // Directory watching not available, config changes will require restart
    }
  }

  dispose(): void {
    this.watcher?.dispose();
    this.settingsListener?.dispose();
    this._onDidChange.dispose();
  }
}
