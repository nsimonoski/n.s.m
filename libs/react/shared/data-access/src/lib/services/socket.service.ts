import { io, Socket } from 'socket.io-client';
import { Environment } from '@org/shared/utils';

class SocketService {
  private socket: Socket;
  private watchEvents: { event: string; data: unknown }[] = [];

  constructor() {
    this.socket = io(Environment.WS_BASE_URL);

    this.socket.on('connect', () => {
      for (const { event, data } of this.watchEvents) {
        this.socket.emit(event, data);
      }
    });
  }

  watch(event: string, data?: unknown): void {
    this.watchEvents = this.watchEvents.filter((e) => e.event !== event);
    this.watchEvents.push({ event, data });

    if (this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  on<T>(event: string, callback: (data: T) => void): () => void {
    this.socket.on(event, callback as (...args: unknown[]) => void);

    return () => {
      this.socket.off(event, callback as (...args: unknown[]) => void);
    };
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

export const socketService = new SocketService();
