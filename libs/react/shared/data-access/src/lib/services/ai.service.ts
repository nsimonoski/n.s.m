import { Ai } from '@org/shared/contracts';
import { Environment } from '@org/shared/utils';

const API_BASE = `${Environment.API_BASE_URL}/ai`;

interface StreamCallbacks {
  onChunk: (chunk: Ai.StreamChunk) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export function sendMessage(request: Ai.ChatRequestDto, callbacks: StreamCallbacks): AbortController {
  const controller = new AbortController();

  fetchAndParseStream(request, controller.signal, callbacks).catch((err) => {
    if (err.name !== 'AbortError') callbacks.onError(err);
  });

  return controller;
}

async function fetchAndParseStream(
  request: Ai.ChatRequestDto,
  signal: AbortSignal,
  { onChunk, onComplete }: StreamCallbacks,
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat`, {
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
        onChunk(chunk);
        if (chunk.done) {
          onComplete();
          return;
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  onComplete();
}
