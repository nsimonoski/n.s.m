import { Injectable, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { sockets } from '@org/angular-utils';
import type { TerminalSocketAdapter } from '@org/shared/terminal';

@Injectable({ providedIn: 'root' })
export class TerminalWsService implements TerminalSocketAdapter {
  private readonly ws = inject(sockets.WebSocketStore);
  private readonly subscriptions: Subscription[] = [];

  emit(event: string, data?: unknown): void {
    this.ws.emit(event, data);
  }

  on<T>(event: string, callback: (data: T) => void): () => void {
    const sub = this.ws.on<T>(event).subscribe(callback);
    this.subscriptions.push(sub);
    return () => sub.unsubscribe();
  }

  onConnect(callback: () => void): () => void {
    return this.ws.onConnect(callback);
  }
}
