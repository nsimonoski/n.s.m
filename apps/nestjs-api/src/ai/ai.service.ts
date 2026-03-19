import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Observable } from 'rxjs';
import { Ai } from '@org/shared/contracts';
import { EnvironmentVariables } from '../common';

@Injectable()
export class AiService {
  private readonly client: Groq;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>(EnvironmentVariables.GROQ_API_KEY) ?? '';
    this.client = new Groq({ apiKey });
  }

  getResponse(request: Ai.ChatRequestDto): Observable<Ai.StreamChunk> {
    return new Observable((subscriber) => {
      this.generateAndEmitTokens(request, subscriber).catch((err) => {
        subscriber.next({ delta: '', done: true, error: String(err) });
        subscriber.complete();
      });
    });
  }

  private async generateAndEmitTokens(
    request: Ai.ChatRequestDto,
    subscriber: { next: (v: Ai.StreamChunk) => void; complete: () => void },
  ): Promise<void> {
    const messages = this.buildMessages(request);

    const stream = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        fullResponse += delta;
        subscriber.next({ delta, done: false });
      }
    }

    const modifiedContent =
      request.command === Ai.CommandType.MODIFY ? this.extractCodeBlock(fullResponse) : undefined;

    subscriber.next({ delta: '', done: true, modifiedContent });
    subscriber.complete();
  }

  private buildMessages(
    request: Ai.ChatRequestDto,
  ): Groq.Chat.Completions.ChatCompletionMessageParam[] {
    const systemParts: string[] = [
      'You are an expert software engineer assistant embedded in a code editor.',
    ];

    if (request.fileContext) {
      const { language, content } = request.fileContext;
      systemParts.push(
        `The user has the following code open:`,
        `\`\`\`${language}`,
        content,
        '```',
      );
    }

    if (request.command === Ai.CommandType.MODIFY) {
      systemParts.push(
        'Apply the requested change to the code and return the COMPLETE modified file wrapped in a single code block. Do not explain, only return the full modified file.',
      );
    }

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemParts.join('\n') },
    ];

    for (const entry of request.history) {
      messages.push({ role: entry.role, content: entry.content });
    }

    const userMessage =
      request.command === Ai.CommandType.EXPLAIN
        ? 'Explain what this code does. Be concise — focus on the purpose and key logic, skip obvious details like imports.'
        : request.message;

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  private extractCodeBlock(text: string): string {
    const match = /```[a-z]*\n([\s\S]*?)```/.exec(text);
    return match ? match[1].trim() : text.trim();
  }
}
