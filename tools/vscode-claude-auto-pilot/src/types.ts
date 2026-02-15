/** Auto-pilot state machine states */
export type AutoPilotState =
  | 'idle'
  | 'claude_outputting'
  | 'idle_detected'
  | 'prompt_detected'
  | 'responding';

/** Context about a detected prompt */
export interface PromptContext {
  /** Cleaned text of the last N lines before the prompt */
  recentOutput: string;
  /** The specific line(s) that matched the prompt pattern */
  promptText: string;
  /** Which pattern matched */
  matchedPattern: string;
  /** Timestamp of detection */
  detectedAt: number;
}

/** Result of an auto-response */
export interface AutoResponse {
  /** The detected prompt */
  prompt: PromptContext;
  /** What the AI decided to respond */
  response: string;
  /** Duration of AI call in ms */
  latencyMs: number;
  /** Timestamp */
  respondedAt: number;
  /** Whether it was sent successfully */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/** Extension configuration */
export interface AutoPilotConfig {
  enabled: boolean;
  instructions: string;
  idleTimeoutMs: number;
  model: 'haiku' | 'sonnet';
  apiKey: string;
  maxResponseLogSize: number;
  promptPatterns: string[];
  claudeBinaryPath: string;
}

/** Chat message structure for sidebar UI */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  content: MessageContent[];
  status: 'streaming' | 'complete' | 'error';
}

/** Content blocks within a message */
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'toolCall'; name: string; description: string }
  | { type: 'toolResult'; name: string; output: string; success: boolean }
  | { type: 'code'; language: string; code: string };

/** UI state for the sidebar chat */
export interface UIState {
  status: 'idle' | 'responding' | 'error' | 'starting';
  statusMessage?: string;
}

/** Messages between webview and extension host */
export type WebviewMessage =
  | { type: 'getConfig' }
  | { type: 'updateConfig'; config: Partial<AutoPilotConfig> }
  | { type: 'getLog' }
  | { type: 'clearLog' }
  | { type: 'configChanged'; config: AutoPilotConfig }
  | { type: 'logUpdated'; entries: AutoResponse[] }
  | { type: 'stateChanged'; state: AutoPilotState }
  | { type: 'sendMessage'; text: string }
  | { type: 'toggleAutoPilot' }
  | { type: 'clearConversation' }
  | { type: 'messagesUpdated'; messages: Message[] }
  | { type: 'uiStateUpdated'; state: UIState };
