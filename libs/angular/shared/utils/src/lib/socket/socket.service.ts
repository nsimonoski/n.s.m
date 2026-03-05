import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Environment } from '@org/shared/utils';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
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

  emit(event: string, data?: unknown): void {
    if (this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  watch(event: string, data?: unknown): void {
    this.watchEvents = this.watchEvents.filter((e) => e.event !== event);
    this.watchEvents.push({ event, data });
    this.emit(event, data);
  }

  on<T = void>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      const handler = (data: T) => subscriber.next(data);
      this.socket.on(event, handler as (...args: unknown[]) => void);

      return () => {
        this.socket.off(event, handler as (...args: unknown[]) => void);
      };
    });
  }

  disconnect(): void {
    this.watchEvents = [];
    this.socket.disconnect();
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
