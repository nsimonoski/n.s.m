export interface TerminalSocketAdapter {
  emit(event: string, data?: unknown): void;
  on<T>(event: string, callback: (data: T) => void): () => void;
  onConnect(callback: () => void): () => void;
}
