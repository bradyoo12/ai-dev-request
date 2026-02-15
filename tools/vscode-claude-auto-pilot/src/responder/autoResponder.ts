import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';
import { AutoResponse, PromptContext } from '../types';
import { ConfigManager } from '../config/configManager';

export class AutoResponder implements vscode.Disposable {
  private client: Anthropic | undefined;
  private abortController: AbortController | undefined;

  constructor(private config: ConfigManager) {}

  /** Generate an auto-response for a detected prompt */
  async respond(context: PromptContext): Promise<AutoResponse> {
    const startTime = Date.now();
    const cfg = this.config.getConfig();

    if (!cfg.apiKey) {
      return {
        prompt: context,
        response: '',
        latencyMs: Date.now() - startTime,
        respondedAt: Date.now(),
        success: false,
        error: 'No API key configured. Set ANTHROPIC_API_KEY or configure in settings.',
      };
    }

    // Lazy-initialize or recreate client if API key changed
    if (!this.client) {
      this.client = new Anthropic({ apiKey: cfg.apiKey });
    }

    try {
      this.abortController = new AbortController();

      const message = await this.client.messages.create(
        {
          model: this.getModelId(cfg.model),
          max_tokens: 256,
          system: this.buildSystemPrompt(cfg.instructions),
          messages: [
            {
              role: 'user',
              content: this.buildUserMessage(context),
            },
          ],
        },
        { signal: this.abortController.signal },
      );

      const textBlock = message.content.find((b) => b.type === 'text');
      const response = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';

      return {
        prompt: context,
        response,
        latencyMs: Date.now() - startTime,
        respondedAt: Date.now(),
        success: true,
      };
    } catch (err) {
      const isAborted = err instanceof Error && err.name === 'AbortError';
      return {
        prompt: context,
        response: '',
        latencyMs: Date.now() - startTime,
        respondedAt: Date.now(),
        success: false,
        error: isAborted ? 'Cancelled by user' : (err instanceof Error ? err.message : String(err)),
      };
    } finally {
      this.abortController = undefined;
    }
  }

  /** Cancel any pending API call */
  cancelPending(): void {
    this.abortController?.abort();
    this.abortController = undefined;
  }

  /** Reset client (e.g., when API key changes) */
  resetClient(): void {
    this.cancelPending();
    this.client = undefined;
  }

  private buildSystemPrompt(userInstructions: string): string {
    return `You are an automated responder for Claude Code CLI running in a terminal. Your job is to answer prompts that Claude CLI presents, based on the user's instructions below.

USER INSTRUCTIONS:
${userInstructions}

RESPONSE RULES:
- Respond with ONLY the exact text to type into the terminal. No explanations, no formatting, no markdown, no quotes.
- For yes/no or y/n questions: respond with just "y" or "n" (lowercase, single character)
- For tool approval prompts (Allow?): respond with just "y" to approve or "n" to deny
- For open-ended questions: provide a concise, direct answer on a single line
- If the user's instructions don't cover this specific prompt, default to approving/yes
- Never wrap your response in quotes, backticks, or any formatting
- Your entire response will be typed directly into the terminal as-is`;
  }

  private buildUserMessage(context: PromptContext): string {
    return `The Claude CLI is waiting for input. Here is the recent terminal output:

---
${context.recentOutput}
---

The detected prompt/question is: "${context.promptText}"

What should I type? Respond with ONLY the text to enter.`;
  }

  private getModelId(model: 'haiku' | 'sonnet'): string {
    switch (model) {
      case 'haiku':
        return 'claude-haiku-4-5-20251001';
      case 'sonnet':
        return 'claude-sonnet-4-5-20250929';
    }
  }

  dispose(): void {
    this.cancelPending();
  }
}
