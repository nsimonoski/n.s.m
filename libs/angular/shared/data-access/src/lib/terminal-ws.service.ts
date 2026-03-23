import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { sockets } from '@org/angular-utils';
import type { TerminalSocketAdapter } from '@org/shared/terminal';

@Injectable({ providedIn: 'root' })
export class TerminalWsService implements TerminalSocketAdapter {
  private readonly socket = inject(sockets.SocketService);
  private readonly subscriptions: Subscription[] = [];

  emit(event: string, data?: unknown): void {
    this.socket.emit(event, data);
  }

  on<T>(event: string, callback: (data: T) => void): () => void {
    const sub = this.socket.on<T>(event).subscribe(callback);
    this.subscriptions.push(sub);
    return () => sub.unsubscribe();
  }

  onConnect(callback: () => void): () => void {
    return this.socket.onConnect(callback);
  }
}
