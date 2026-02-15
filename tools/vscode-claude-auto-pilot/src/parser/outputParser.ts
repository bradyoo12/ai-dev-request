import { Message, MessageContent } from '../types';
import { stripAnsi } from '../utils/stripAnsi';

/** Parser states for the output stream */
type ParserState = 'IDLE' | 'STREAMING_ASSISTANT' | 'COMPLETE';

/** Events emitted by the output parser */
export interface OutputParserEvents {
  onMessageUpdated: (message: Message) => void;
  onNewMessage: (message: Message) => void;
  onPromptDetected: (promptText: string) => void;
}

/** Patterns that indicate Claude is waiting for user input */
const PROMPT_PATTERNS = [
  /Do you want to proceed\?/i,
  /\(Y\/n\)/i,
  /\(y\/N\)/i,
  /Press Enter to continue/i,
  /Type your response/i,
  />\s*$/,
  /\?\s*$/,
  /Allow\s/i,
  /Approve\s/i,
  /Deny\s/i,
];

/** Patterns for detecting tool call blocks */
const TOOL_CALL_PATTERNS = [
  /(?:Running|Executing|Using)\s+(?:tool\s+)?[`"]?(\w+)[`"]?/i,
  /Tool:\s*(\w+)/i,
  /(?:Read|Write|Edit|Bash|Glob|Grep)\s*(?:\(|:)/i,
];

/** Patterns for detecting tool results */
const TOOL_RESULT_SUCCESS = /(?:Success|Done|Completed|Created|Updated|Modified)/i;
const TOOL_RESULT_ERROR = /(?:Error|Failed|Exception|Cannot|Unable)/i;

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

export class OutputParser {
  private state: ParserState = 'IDLE';
  private buffer = '';
  private currentMessage: Message | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private events: OutputParserEvents;

  /** Idle timeout before considering a message complete (ms) */
  private readonly idleTimeoutMs = 1500;

  constructor(events: OutputParserEvents) {
    this.events = events;
  }

  /** Feed a chunk of raw terminal data into the parser */
  feedChunk(rawData: string): void {
    const cleaned = stripAnsi(rawData);
    if (!cleaned.trim()) return;

    this.buffer += cleaned;

    // Reset idle timer on each chunk
    this.resetIdleTimer();

    // Transition to streaming if idle
    if (this.state === 'IDLE' || this.state === 'COMPLETE') {
      this.state = 'STREAMING_ASSISTANT';
      this.currentMessage = {
        id: generateMessageId(),
        role: 'assistant',
        timestamp: Date.now(),
        content: [],
        status: 'streaming',
      };
    }

    // Parse the accumulated buffer into content blocks
    this.parseBuffer();

    // Emit streaming update
    if (this.currentMessage) {
      this.events.onMessageUpdated({ ...this.currentMessage });
    }
  }

  /** Add a user message (e.g., when auto-responder sends input) */
  addUserMessage(text: string): Message {
    const msg: Message = {
      id: generateMessageId(),
      role: 'user',
      timestamp: Date.now(),
      content: [{ type: 'text', text }],
      status: 'complete',
    };
    this.events.onNewMessage(msg);
    return msg;
  }

  /** Reset the parser state */
  reset(): void {
    this.clearIdleTimer();
    this.buffer = '';
    this.currentMessage = null;
    this.state = 'IDLE';
  }

  getState(): ParserState {
    return this.state;
  }

  dispose(): void {
    this.clearIdleTimer();
  }

  private parseBuffer(): void {
    if (!this.currentMessage) return;

    const content: MessageContent[] = [];
    let remaining = this.buffer;

    // Extract thinking blocks
    const thinkingRegex = /<thinking>([\s\S]*?)(?:<\/thinking>|$)/g;
    let thinkingMatch: RegExpExecArray | null;
    const thinkingRanges: Array<{ start: number; end: number }> = [];

    while ((thinkingMatch = thinkingRegex.exec(remaining)) !== null) {
      const text = thinkingMatch[1].trim();
      if (text) {
        content.push({ type: 'thinking', text });
      }
      thinkingRanges.push({
        start: thinkingMatch.index,
        end: thinkingMatch.index + thinkingMatch[0].length,
      });
    }

    // Remove thinking blocks from remaining text
    let cleaned = remaining;
    for (let i = thinkingRanges.length - 1; i >= 0; i--) {
      const range = thinkingRanges[i];
      cleaned = cleaned.slice(0, range.start) + cleaned.slice(range.end);
    }

    // Extract code blocks
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)(?:```|$)/g;
    let codeMatch: RegExpExecArray | null;
    const codeRanges: Array<{ start: number; end: number }> = [];

    while ((codeMatch = codeBlockRegex.exec(cleaned)) !== null) {
      const language = codeMatch[1] || 'text';
      const code = codeMatch[2].trimEnd();
      if (code) {
        content.push({ type: 'code', language, code });
      }
      codeRanges.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length,
      });
    }

    // Remove code blocks from text
    let textOnly = cleaned;
    for (let i = codeRanges.length - 1; i >= 0; i--) {
      const range = codeRanges[i];
      textOnly = textOnly.slice(0, range.start) + '\n' + textOnly.slice(range.end);
    }

    // Detect tool calls in the remaining text
    const lines = textOnly.split('\n');
    const textLines: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check for tool call patterns
      let isToolCall = false;
      for (const pattern of TOOL_CALL_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          const toolName = match[1] || this.extractToolName(line);
          if (toolName) {
            // Collect description lines (indented or part of the tool block)
            let description = line;
            let j = i + 1;
            while (j < lines.length && (lines[j].startsWith('  ') || lines[j].startsWith('\t'))) {
              description += '\n' + lines[j];
              j++;
            }
            content.push({ type: 'toolCall', name: toolName, description: description.trim() });
            i = j;
            isToolCall = true;
            break;
          }
        }
      }

      if (!isToolCall) {
        // Check for tool result patterns
        if (TOOL_RESULT_SUCCESS.test(line) && this.hasRecentToolCall(content)) {
          const toolCall = this.findLastToolCall(content);
          if (toolCall) {
            content.push({
              type: 'toolResult',
              name: toolCall.name,
              output: line.trim(),
              success: true,
            });
            i++;
            continue;
          }
        }

        if (TOOL_RESULT_ERROR.test(line) && this.hasRecentToolCall(content)) {
          const toolCall = this.findLastToolCall(content);
          if (toolCall) {
            content.push({
              type: 'toolResult',
              name: toolCall.name,
              output: line.trim(),
              success: false,
            });
            i++;
            continue;
          }
        }

        textLines.push(line);
        i++;
      }
    }

    // Add remaining text as a text block
    const textContent = textLines.join('\n').trim();
    if (textContent) {
      content.unshift({ type: 'text', text: textContent });
    }

    // If no content was parsed, add the entire buffer as text
    if (content.length === 0 && this.buffer.trim()) {
      content.push({ type: 'text', text: this.buffer.trim() });
    }

    this.currentMessage.content = content;

    // Check for prompt patterns in the last few lines
    const lastLines = this.buffer.split('\n').slice(-5);
    for (const promptLine of lastLines) {
      for (const pattern of PROMPT_PATTERNS) {
        if (pattern.test(promptLine)) {
          this.events.onPromptDetected(promptLine.trim());
          return;
        }
      }
    }
  }

  private extractToolName(line: string): string {
    // Try to extract a known tool name from the line
    const knownTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'TodoWrite'];
    for (const tool of knownTools) {
      if (line.includes(tool)) {
        return tool;
      }
    }
    // Fallback: extract word after "tool" keyword
    const match = line.match(/(?:tool|using|running)\s+(\w+)/i);
    return match?.[1] ?? '';
  }

  private hasRecentToolCall(content: MessageContent[]): boolean {
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i].type === 'toolCall') return true;
      if (content[i].type === 'text') return false;
    }
    return false;
  }

  private findLastToolCall(content: MessageContent[]): Extract<MessageContent, { type: 'toolCall' }> | null {
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i].type === 'toolCall') {
        return content[i] as Extract<MessageContent, { type: 'toolCall' }>;
      }
    }
    return null;
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => this.onIdleTimeout(), this.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  private onIdleTimeout(): void {
    this.idleTimer = undefined;

    if (this.state === 'STREAMING_ASSISTANT' && this.currentMessage) {
      // Mark the current message as complete
      this.currentMessage.status = 'complete';
      this.state = 'COMPLETE';

      this.events.onNewMessage({ ...this.currentMessage });

      // Reset for next message
      this.buffer = '';
      this.currentMessage = null;
    }
  }
}
