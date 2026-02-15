import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConversationStore } from '../store/conversationStore';
import { OutputParser } from '../parser/outputParser';
import { PromptDetector } from '../detection/promptDetector';
import { AutoResponder } from '../responder/autoResponder';
import { ProcessManager } from '../process/processManager';
import { ConfigManager } from '../config/configManager';
import { ResponseLog } from '../logging/responseLog';
import { AutoPilotStatusBar } from '../ui/statusBar';
import { UIState, WebviewMessage, PromptContext } from '../types';

export class ChatViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = 'claudeAutoPilot.chatView';

  private view: vscode.WebviewView | undefined;
  private disposables: vscode.Disposable[] = [];

  private readonly _onSendMessage = new vscode.EventEmitter<string>();
  readonly onSendMessage = this._onSendMessage.event;

  private readonly _onToggleAutoPilot = new vscode.EventEmitter<void>();
  readonly onToggleAutoPilot = this._onToggleAutoPilot.event;

  private readonly _onClearConversation = new vscode.EventEmitter<void>();
  readonly onClearConversation = this._onClearConversation.event;

  // Auto-pilot components
  private readonly outputParser: OutputParser;
  private readonly promptDetector: PromptDetector;
  private readonly autoResponder: AutoResponder;
  private readonly processManager: ProcessManager;
  private isAutoResponding = false;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly conversationStore: ConversationStore,
    private readonly config: ConfigManager,
    private readonly responseLog: ResponseLog,
    private readonly statusBar: AutoPilotStatusBar,
  ) {
    // Initialize auto-pilot components
    this.processManager = new ProcessManager(config);
    this.promptDetector = new PromptDetector(config);
    this.autoResponder = new AutoResponder(config);
    this.outputParser = new OutputParser({
      onMessageUpdated: (message) => {
        this.conversationStore.updateMessage(message.id, message);
      },
      onNewMessage: (message) => {
        this.conversationStore.addMessage(message);
      },
      onPromptDetected: (promptText) => {
        // Feed detected prompt text to the PromptDetector for confirmation
        this.promptDetector.feed(promptText);
      },
    });

    this.wireAutoPilot();

    // Forward store changes to webview
    this.disposables.push(
      this.conversationStore.onMessagesChanged((messages) => {
        this.postMessage({ type: 'messagesUpdated', messages });
      }),
    );
  }

  /** Get the ProcessManager for external access */
  getProcessManager(): ProcessManager {
    return this.processManager;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (msg: WebviewMessage) => this.handleWebviewMessage(msg),
      undefined,
      this.disposables,
    );

    // Send current state when view becomes visible
    webviewView.onDidChangeVisibility(
      () => {
        if (webviewView.visible) {
          this.sendCurrentState();
        }
      },
      undefined,
      this.disposables,
    );

    // Send initial state
    this.sendCurrentState();
  }

  /** Update the UI state shown in the sidebar */
  updateUIState(state: UIState): void {
    this.postMessage({ type: 'uiStateUpdated', state });
  }

  /** Start Claude CLI and begin auto-pilot session */
  startSession(): void {
    if (this.processManager.isRunning()) return;

    this.updateUIState({ status: 'starting', statusMessage: 'Starting Claude CLI...' });
    this.conversationStore.addMessage({
      id: `sys_${Date.now()}`,
      role: 'system',
      timestamp: Date.now(),
      content: [{ type: 'text', text: 'Starting Claude Auto-Pilot session...' }],
      status: 'complete',
    });

    this.processManager.start();
  }

  private wireAutoPilot(): void {
    // 1. ProcessManager output -> OutputParser (for message parsing)
    //    and -> PromptDetector (for prompt detection)
    this.disposables.push(
      this.processManager.onData((rawData) => {
        this.outputParser.feedChunk(rawData);
        this.promptDetector.feed(rawData);
      }),
    );

    // 2. PromptDetector -> AutoResponder -> ProcessManager
    this.disposables.push(
      this.promptDetector.onPromptDetected((promptContext: PromptContext) => {
        this.handleAutoResponse(promptContext);
      }),
    );

    // 3. PromptDetector state changes -> StatusBar + UI
    this.disposables.push(
      this.promptDetector.onStateChanged((state) => {
        this.statusBar.setState(state);
        if (state === 'responding') {
          this.updateUIState({ status: 'responding', statusMessage: 'Auto-Pilot responding...' });
        } else if (state === 'prompt_detected') {
          this.updateUIState({ status: 'responding', statusMessage: 'Prompt detected...' });
        } else if (state === 'claude_outputting') {
          this.updateUIState({ status: 'responding', statusMessage: 'Claude is responding...' });
        } else if (state === 'idle' || state === 'idle_detected') {
          if (!this.isAutoResponding) {
            this.updateUIState({ status: 'idle' });
          }
        }
      }),
    );

    // 4. Process exit handling
    this.disposables.push(
      this.processManager.onExit((exitCode) => {
        this.outputParser.reset();
        this.promptDetector.reset();
        this.conversationStore.addMessage({
          id: `sys_${Date.now()}`,
          role: 'system',
          timestamp: Date.now(),
          content: [{ type: 'text', text: `Claude CLI exited (code: ${exitCode})` }],
          status: 'complete',
        });
        this.updateUIState({ status: 'idle', statusMessage: 'Session ended' });
      }),
    );

    // 5. Process error handling
    this.disposables.push(
      this.processManager.onError((errorMsg) => {
        this.conversationStore.addMessage({
          id: `err_${Date.now()}`,
          role: 'system',
          timestamp: Date.now(),
          content: [{ type: 'text', text: errorMsg }],
          status: 'error',
        });
        this.updateUIState({ status: 'error', statusMessage: errorMsg });
      }),
    );

    // 6. Config changes -> update prompt detector enabled state
    this.disposables.push(
      this.config.onDidChange((cfg) => {
        this.promptDetector.setEnabled(cfg.enabled);
        if (!cfg.apiKey) {
          this.autoResponder.resetClient();
        }
      }),
    );
  }

  private async handleAutoResponse(context: PromptContext): Promise<void> {
    const cfg = this.config.getConfig();
    if (!cfg.enabled) return;

    this.isAutoResponding = true;
    this.promptDetector.markResponding();
    this.statusBar.setState('responding');
    this.updateUIState({ status: 'responding', statusMessage: 'Auto-Pilot responding...' });

    // Add system message showing auto-pilot is responding
    const autoPilotMsgId = `ap_${Date.now()}`;
    this.conversationStore.addMessage({
      id: autoPilotMsgId,
      role: 'system',
      timestamp: Date.now(),
      content: [{ type: 'text', text: `Auto-Pilot responding to: "${context.promptText}"` }],
      status: 'streaming',
    });

    const result = await this.autoResponder.respond(context);
    this.responseLog.add(result);

    if (!this.isAutoResponding) {
      // User took over during API call
      return;
    }

    this.isAutoResponding = false;

    if (result.success && result.response) {
      // Send the response to the CLI process
      this.processManager.sendLine(result.response);
      this.statusBar.incrementResponseCount();
      this.promptDetector.reset();

      // Update the system message and add user message showing what was sent
      this.conversationStore.updateMessage(autoPilotMsgId, { status: 'complete' });
      this.outputParser.addUserMessage(`[Auto-Pilot] ${result.response}`);

      this.updateUIState({ status: 'responding', statusMessage: 'Claude is responding...' });
    } else {
      // Error - show in red
      this.conversationStore.updateMessage(autoPilotMsgId, {
        status: 'error',
        content: [{ type: 'text', text: `Auto-Pilot error: ${result.error}` }],
      });
      this.promptDetector.reset();
      this.updateUIState({ status: 'error', statusMessage: `Error: ${result.error}` });
    }
  }

  /** Post a message to the webview */
  private postMessage(msg: WebviewMessage): void {
    this.view?.webview.postMessage(msg);
  }

  /** Send current conversation state to webview */
  private sendCurrentState(): void {
    const messages = this.conversationStore.getMessages();
    this.postMessage({ type: 'messagesUpdated', messages });
  }

  private handleWebviewMessage(msg: WebviewMessage): void {
    switch (msg.type) {
      case 'sendMessage':
        this.handleUserMessage(msg.text);
        break;
      case 'toggleAutoPilot':
        this._onToggleAutoPilot.fire();
        break;
      case 'clearConversation':
        this._onClearConversation.fire();
        break;
      case 'openSettings' as string:
        vscode.commands.executeCommand('claudeAutoPilot.editInstructions');
        break;
    }
  }

  private handleUserMessage(text: string): void {
    // Add user message to conversation
    this.outputParser.addUserMessage(text);

    // Start session if not running
    if (!this.processManager.isRunning()) {
      this.startSession();
      // Wait a moment for the process to start, then send the message
      setTimeout(() => {
        this.processManager.sendLine(text);
      }, 500);
    } else {
      // Send directly to the running process
      this.processManager.sendLine(text);
    }

    this.updateUIState({ status: 'responding', statusMessage: 'Claude is responding...' });
  }

  private getHtmlContent(_webview: vscode.Webview): string {
    const htmlPath = path.join(
      this.extensionUri.fsPath,
      'src',
      'sidebar',
      'chatView.html',
    );
    return fs.readFileSync(htmlPath, 'utf-8');
  }

  dispose(): void {
    this.outputParser.dispose();
    this.promptDetector.dispose();
    this.autoResponder.dispose();
    this.processManager.dispose();
    this._onSendMessage.dispose();
    this._onToggleAutoPilot.dispose();
    this._onClearConversation.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
