import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { FILE_CHANGE_EVENT, FILE_WATCH_EVENT, FileChangeEvent } from '@org/shared/contracts';

@Injectable({ providedIn: 'root' })
export class FileExplorerWsService implements OnDestroy {
  private socket: Socket;

  fileChanges$: Observable<FileChangeEvent>;

  constructor() {
    this.socket = io('http://localhost:3000');

    this.fileChanges$ = new Observable<FileChangeEvent>((subscriber) => {
      this.socket.on(FILE_CHANGE_EVENT, (event: FileChangeEvent) => {
        subscriber.next(event);
      });

      return () => {
        this.socket.off(FILE_CHANGE_EVENT);
      };
    });
  }

  watchPath(path: string) {
    this.socket.emit(FILE_WATCH_EVENT, path);
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
