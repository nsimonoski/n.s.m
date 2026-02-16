import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { GIT_CHANGE_EVENT, GIT_WATCH_EVENT } from '@org/shared/contracts';
import { sockets } from '@org/angular-utils';

@Injectable({ providedIn: 'root' })
export class GitWsService {
  private readonly socket = inject(sockets.SocketService);

  gitChanges$: Observable<void> = this.socket.on<void>(GIT_CHANGE_EVENT);

  watchPath(path: string) {
    this.socket.watch(GIT_WATCH_EVENT, path);
  }
}
