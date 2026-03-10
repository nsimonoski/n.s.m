import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ai } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly API_BASE = `${Environment.API_BASE_URL}/ai`;

  sendMessage(request: Ai.ChatRequestDto): Observable<Ai.StreamChunk> {
    return new Observable((subscriber) => {
      const controller = new AbortController();

      this.fetchAndParseStream(request, controller.signal, subscriber).catch((err) => {
        if (err.name !== 'AbortError') subscriber.error(err);
      });

      return () => controller.abort();
    });
  }

  private async fetchAndParseStream(
    request: Ai.ChatRequestDto,
    signal: AbortSignal,
    subscriber: {
      next: (v: Ai.StreamChunk) => void;
      complete: () => void;
      error: (e: unknown) => void;
    },
  ): Promise<void> {
    const response = await fetch(`${this.API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const chunk: Ai.StreamChunk = JSON.parse(line.slice(6));
          subscriber.next(chunk);
          if (chunk.done) {
            subscriber.complete();
            return;
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    subscriber.complete();
  }
}
