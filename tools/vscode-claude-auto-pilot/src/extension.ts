import * as vscode from 'vscode';
import { ConfigManager } from './config/configManager';
import { ResponseLog } from './logging/responseLog';
import { AutoPilotStatusBar } from './ui/statusBar';
import { SettingsPanel } from './views/settingsPanel';
import { ClaudePtyTerminal } from './terminal/claudePtyTerminal';
import { ConversationStore } from './store/conversationStore';
import { ChatViewProvider } from './sidebar/chatViewProvider';
import { ClaudeProcessManager } from './process/claudeProcessManager';

let activeTerminal: ClaudePtyTerminal | undefined;
let processManager: ClaudeProcessManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const config = new ConfigManager();
  const responseLog = new ResponseLog(config);
  const statusBar = new AutoPilotStatusBar(config);
  const settingsPanel = new SettingsPanel(config, responseLog);

  // Sidebar chat infrastructure
  const conversationStore = new ConversationStore();
  const chatViewProvider = new ChatViewProvider(
    context.extensionUri,
    conversationStore,
  );
  processManager = new ClaudeProcessManager();

  // Register sidebar webview provider
  const chatViewRegistration = vscode.window.registerWebviewViewProvider(
    ChatViewProvider.viewType,
    chatViewProvider,
  );

  // Handle send message from sidebar: start process if needed and send input
  const sendMessageDisposable = chatViewProvider.onSendMessage((text) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const cwd = workspaceFolder ?? process.cwd();

    // Add user message to conversation
    conversationStore.addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      timestamp: Date.now(),
      content: [{ type: 'text', text }],
      status: 'complete',
    });

    // Start process if not running
    if (!processManager!.isRunning()) {
      chatViewProvider.updateUIState({ status: 'starting', statusMessage: 'Starting Claude CLI...' });
      processManager!.start(cwd);
    }

    // Send input to process (with Enter to submit)
    processManager!.sendInput(text + '\n');
    chatViewProvider.updateUIState({ status: 'responding' });
  });

  // Handle process output: add raw chunks as assistant messages
  const outputDisposable = processManager.onOutputReceived((data) => {
    const currentId = conversationStore.getCurrentMessageId();
    if (currentId) {
      // Update existing streaming message
      const messages = conversationStore.getMessages();
      const existing = messages.find((m) => m.id === currentId);
      if (existing) {
        const textContent = existing.content.find((c) => c.type === 'text');
        if (textContent && textContent.type === 'text') {
          conversationStore.updateMessage(currentId, {
            content: [{ type: 'text', text: textContent.text + data }],
          });
        }
      }
    } else {
      // Start new assistant message
      const newId = `msg-${Date.now()}`;
      conversationStore.setCurrentMessageId(newId);
      conversationStore.addMessage({
        id: newId,
        role: 'assistant',
        timestamp: Date.now(),
        content: [{ type: 'text', text: data }],
        status: 'streaming',
      });
    }
  });

  // Handle process exit
  const exitDisposable = processManager.onProcessExited((exitCode) => {
    const currentId = conversationStore.getCurrentMessageId();
    if (currentId) {
      conversationStore.updateMessage(currentId, { status: 'complete' });
      conversationStore.setCurrentMessageId(null);
    }
    chatViewProvider.updateUIState({
      status: exitCode === 0 ? 'idle' : 'error',
      statusMessage: exitCode === 0 ? 'Process exited' : `Process exited with code ${exitCode}`,
    });
  });

  // Handle toggle from sidebar
  const toggleFromSidebar = chatViewProvider.onToggleAutoPilot(async () => {
    await vscode.commands.executeCommand('claudeAutoPilot.toggleAutoPilot');
  });

  // Handle clear conversation from sidebar
  const clearFromSidebar = chatViewProvider.onClearConversation(() => {
    conversationStore.clear();
    if (processManager?.isRunning()) {
      processManager.stop();
    }
    chatViewProvider.updateUIState({ status: 'idle' });
  });

  // Clear conversation command
  const clearCmd = vscode.commands.registerCommand(
    'claudeAutoPilot.clearConversation',
    () => {
      conversationStore.clear();
      chatViewProvider.updateUIState({ status: 'idle' });
    },
  );

  // Start a new Claude CLI session with auto-pilot
  const startCmd = vscode.commands.registerCommand('claudeAutoPilot.startSession', () => {
    if (activeTerminal) {
      vscode.window.showWarningMessage(
        'A Claude Auto-Pilot session is already running. Close it first to start a new one.',
      );
      return;
    }

    const pty = new ClaudePtyTerminal(config, responseLog, statusBar);
    activeTerminal = pty;

    const terminal = vscode.window.createTerminal({
      name: 'Claude Auto-Pilot',
      pty,
      iconPath: new vscode.ThemeIcon('rocket'),
    });

    terminal.show();

    // Clean up when terminal closes
    const closeListener = vscode.window.onDidCloseTerminal((t) => {
      if (t === terminal) {
        activeTerminal?.dispose();
        activeTerminal = undefined;
        closeListener.dispose();
      }
    });

    context.subscriptions.push(closeListener);
  });

  // Toggle auto-pilot on/off
  const toggleCmd = vscode.commands.registerCommand(
    'claudeAutoPilot.toggleAutoPilot',
    async () => {
      const current = config.getConfig();
      await config.updateConfig({ enabled: !current.enabled });
      vscode.window.showInformationMessage(
        `Claude Auto-Pilot ${!current.enabled ? 'enabled' : 'disabled'}`,
      );
    },
  );

  // Open settings panel
  const settingsCmd = vscode.commands.registerCommand(
    'claudeAutoPilot.editInstructions',
    () => {
      settingsPanel.show();
    },
  );

  // Show response log (opens settings panel with log section)
  const logCmd = vscode.commands.registerCommand('claudeAutoPilot.showLog', () => {
    settingsPanel.show();
  });

  // Pause auto-pilot for the next prompt only
  const pauseCmd = vscode.commands.registerCommand('claudeAutoPilot.pauseForNext', () => {
    if (activeTerminal) {
      activeTerminal.pauseForNextPrompt();
      vscode.window.showInformationMessage(
        'Auto-Pilot will pause for the next prompt. Type your response manually.',
      );
    } else {
      vscode.window.showWarningMessage('No active Auto-Pilot session.');
    }
  });

  context.subscriptions.push(
    startCmd,
    toggleCmd,
    settingsCmd,
    logCmd,
    pauseCmd,
    config,
    responseLog,
    statusBar,
    settingsPanel,
  );
}

export function deactivate(): void {
  activeTerminal?.dispose();
  activeTerminal = undefined;
}
