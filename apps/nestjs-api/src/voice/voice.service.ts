import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { VoiceControl } from '@org/shared/contracts';
import { EnvironmentVariables } from '../common';
import { VoiceRateLimitGuard } from './voice-rate-limit.guard';

const INTENT_VALUES = Object.values(VoiceControl.VoiceIntent).join(', ');

const SYSTEM_PROMPT = `You are a voice command parser for a code editor IDE. Given a transcribed voice command, extract the user's intent and any parameters.

Return JSON with this exact structure:
{ "intent": "<intent>", "params": {}, "confidence": <0-1> }

Valid intents: ${INTENT_VALUES}

Examples:
- "commit with message fix login bug" → { "intent": "git:commit", "params": { "message": "fix login bug" }, "confidence": 0.95 }
- "push to remote" → { "intent": "git:push", "params": {}, "confidence": 0.9 }
- "stage all changes" → { "intent": "git:stage-all", "params": {}, "confidence": 0.95 }
- "stash my changes" → { "intent": "git:stash", "params": {}, "confidence": 0.9 }
- "save the file" → { "intent": "editor:save", "params": {}, "confidence": 0.95 }
- "close this tab" → { "intent": "editor:close-tab", "params": {}, "confidence": 0.9 }
- "open terminal" or "toggle terminal" → { "intent": "layout:toggle-terminal", "params": {}, "confidence": 0.9 }
- "switch to git panel" → { "intent": "layout:switch-panel", "params": { "panel": "git" }, "confidence": 0.9 }
- "switch to AI panel" → { "intent": "layout:switch-panel", "params": { "panel": "ai" }, "confidence": 0.9 }
- "ask AI what this file does" → { "intent": "ai:explain", "params": {}, "confidence": 0.9 }
- "ask AI how to implement sorting" → { "intent": "ai:chat", "params": { "message": "how to implement sorting" }, "confidence": 0.9 }
- "run npm install in terminal" → { "intent": "terminal:run", "params": { "command": "npm install" }, "confidence": 0.95 }
- "run ls" → { "intent": "terminal:run", "params": { "command": "ls" }, "confidence": 0.9 }
- "create file utils.ts" → { "intent": "file:create", "params": { "path": "utils.ts" }, "confidence": 0.85 }
- "create directory src/helpers" → { "intent": "dir:create", "params": { "path": "src/helpers" }, "confidence": 0.85 }
- "clear the terminal" → { "intent": "terminal:clear", "params": {}, "confidence": 0.95 }
- "new terminal session" or "open new terminal" → { "intent": "terminal:new-session", "params": {}, "confidence": 0.9 }
- "kill the process" or "stop the terminal" → { "intent": "terminal:kill", "params": {}, "confidence": 0.9 }
- "review this code" → { "intent": "ai:review", "params": {}, "confidence": 0.9 }
- "refactor to use async await" → { "intent": "ai:refactor", "params": { "instruction": "refactor to use async await" }, "confidence": 0.9 }
- "fix the null pointer error" → { "intent": "ai:fix-error", "params": { "instruction": "fix the null pointer error" }, "confidence": 0.9 }
- "pop stash" → { "intent": "git:stash-pop", "params": {}, "confidence": 0.9 }
- "unstage all" → { "intent": "git:unstage-all", "params": {}, "confidence": 0.9 }
- "discard all changes" → { "intent": "git:discard-all", "params": {}, "confidence": 0.9 }
- "checkout main" → { "intent": "git:checkout", "params": { "branch": "main" }, "confidence": 0.9 }
- "close all tabs" → { "intent": "editor:close-all", "params": {}, "confidence": 0.9 }
- "close other tabs" → { "intent": "editor:close-others", "params": {}, "confidence": 0.9 }
- "toggle sidebar" → { "intent": "layout:toggle-sidebar", "params": {}, "confidence": 0.9 }
- "clear chat" → { "intent": "ai:clear-chat", "params": {}, "confidence": 0.9 }
- "plan the authentication feature" → { "intent": "ai:plan", "params": { "message": "plan the authentication feature" }, "confidence": 0.9 }
- "document this file" → { "intent": "ai:document", "params": {}, "confidence": 0.9 }
- "create a ticket for the login bug" → { "intent": "ai:ticket", "params": { "message": "create a ticket for the login bug" }, "confidence": 0.9 }
- "review this code and suggest a commit message" → { "intent": "ai:chain", "params": { "message": "review this code and suggest a commit message" }, "confidence": 0.9, "steps": [{ "intent": "ai:review", "params": {} }, { "intent": "ai:chat", "params": { "message": "suggest a commit message based on your review" } }] }

- "install claude" or "install claude code" → { "intent": "tool:install-claude", "params": {}, "confidence": 0.95 }
- "use claude" or "open claude" or "run claude" → { "intent": "tool:run-claude", "params": {}, "confidence": 0.95 }

For multi-step commands (e.g. "do X and then Y", "X and suggest Y"), use intent "ai:chain" with a "steps" array. Each step has "intent" and "params".

If the intent is unclear, use "unknown" with confidence 0.
Only return the JSON object, no explanation.`;

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly client: Groq;

  constructor(
    private readonly config: ConfigService,
    private readonly rateLimitGuard: VoiceRateLimitGuard,
  ) {
    const apiKey = this.config.get<string>(EnvironmentVariables.GROQ_API_KEY) ?? '';
    this.client = new Groq({ apiKey });
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([new Uint8Array(audioBuffer)], `audio.${extension}`, { type: mimeType });

    const result = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
    });

    const estimatedSeconds = audioBuffer.length / 16000;
    await this.rateLimitGuard.trackAudioDuration(estimatedSeconds);

    return result.text;
  }

  async parseIntent(text: string): Promise<VoiceControl.ParseIntentResponseDto> {
    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content ?? '{}';

    try {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent ?? VoiceControl.VoiceIntent.Unknown,
        params: parsed.params ?? {},
        confidence: parsed.confidence ?? 0,
        steps: parsed.steps,
      };
    } catch {
      this.logger.warn(`Failed to parse LLM response: ${content}`);
      return { intent: VoiceControl.VoiceIntent.Unknown, params: {}, confidence: 0 };
    }
  }

  async processCommand(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<VoiceControl.VoiceCommandResult> {
    const estimatedSeconds = audioBuffer.length / 16000;
    await this.rateLimitGuard.checkAudioQuota(estimatedSeconds);

    const rawTranscription = await this.transcribe(audioBuffer, mimeType);
    const { intent, params, confidence, steps } = await this.parseIntent(rawTranscription);

    return { intent, params, rawTranscription, confidence, steps };
  }
}
