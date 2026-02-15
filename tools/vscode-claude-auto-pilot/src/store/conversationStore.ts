import * as vscode from 'vscode';
import { Message } from '../types';

export class ConversationStore implements vscode.Disposable {
  private readonly _onMessagesChanged = new vscode.EventEmitter<Message[]>();
  readonly onMessagesChanged = this._onMessagesChanged.event;

  private messages: Message[] = [];
  private currentMessageId: string | null = null;

  /** Add a new message to the conversation */
  addMessage(message: Message): void {
    this.messages.push(message);
    this._onMessagesChanged.fire([...this.messages]);
  }

  /** Update an existing message (for streaming updates) */
  updateMessage(id: string, updates: Partial<Message>): void {
    const index = this.messages.findIndex((m) => m.id === id);
    if (index >= 0) {
      this.messages[index] = { ...this.messages[index], ...updates };
      this._onMessagesChanged.fire([...this.messages]);
    }
  }

  /** Get all messages */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /** Get the ID of the message currently being streamed */
  getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  /** Set the ID of the message currently being streamed */
  setCurrentMessageId(id: string | null): void {
    this.currentMessageId = id;
  }

  /** Clear all messages */
  clear(): void {
    this.messages = [];
    this.currentMessageId = null;
    this._onMessagesChanged.fire([]);
  }

  dispose(): void {
    this._onMessagesChanged.dispose();
  }
}
