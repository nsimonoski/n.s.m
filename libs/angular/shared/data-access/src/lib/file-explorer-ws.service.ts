import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { FILE_CHANGE_EVENT, FILE_WATCH_EVENT, FileChangeEvent } from '@org/shared/contracts';
import { sockets } from '@org/angular-utils';

@Injectable({ providedIn: 'root' })
export class FileExplorerWsService {
  private readonly socket = inject(sockets.SocketService);

  fileChanges$: Observable<FileChangeEvent> = this.socket.on<FileChangeEvent>(FILE_CHANGE_EVENT);

  watchDirectoryForChanges(path: string) {
    this.socket.watch(FILE_WATCH_EVENT, path);
  }
}
