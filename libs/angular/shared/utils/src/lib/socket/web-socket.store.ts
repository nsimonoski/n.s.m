import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals';
import { SocketService } from './socket.service';

export const WebSocketStore = signalStore(
  { providedIn: 'root' },
  withState<{ connected: boolean }>({ connected: false }),
  withProps(() => ({
    _socket: inject(SocketService),
  })),
  withMethods((store) => ({
    on: store._socket.on.bind(store._socket),
    emit: store._socket.emit.bind(store._socket),
    watch: store._socket.watch.bind(store._socket),
    onConnect: store._socket.onConnect.bind(store._socket),
    reconnect: store._socket.reconnect.bind(store._socket),
    disconnect: store._socket.disconnect.bind(store._socket),
  })),
  withHooks({
    onInit(store) {
      store._socket.onConnect(() => patchState(store, { connected: true }));
      store._socket.on('disconnect').subscribe(() => patchState(store, { connected: false }));
    },
  }),
);
