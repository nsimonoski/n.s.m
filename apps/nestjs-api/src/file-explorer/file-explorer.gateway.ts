import { OnModuleDestroy, Logger } from '@nestjs/common';
import * as chokidar from 'chokidar';
import { Server } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

import { FILE_CHANGE_EVENT, FILE_WATCH_EVENT, FileChangeEvent } from '@org/shared/contracts';

const DEBOUNCE_MS = 500;

@WebSocketGateway({ cors: { origin: ['http://localhost:4200', 'http://localhost:4201'] } })
export class FileExplorerGateway implements OnModuleDestroy {
  private readonly logger = new Logger(FileExplorerGateway.name);
  private watcher: chokidar.FSWatcher | null = null;
  private pendingEvents = new Map<string, FileChangeEvent>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(FILE_WATCH_EVENT)
  handleWatch(@MessageBody() path: string) {
    if (this.watcher) {
      this.watcher.close();
    }

    this.logger.log(`Watching file system at ${path}`);

    const IGNORED_DIRS = [
      '/node_modules',
      '/.git',
      '/dist',
      '/.nx',
      '/.angular',
      '/.cache',
      '/tmp',
    ];

    this.watcher = chokidar.watch(path, {
      ignored: (filePath: string) => IGNORED_DIRS.some((dir) => filePath.includes(dir)),
      ignoreInitial: true,
      persistent: true,
      usePolling: true,
      interval: 1000,
      depth: 10,
    });

    this.watcher.on('all', (eventType, filePath) => {
      const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
      this.pendingEvents.set(parentPath, {
        type: eventType as FileChangeEvent['type'],
        path: filePath,
      });

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => this.flush(), DEBOUNCE_MS);
    });
  }

  private flush() {
    for (const event of this.pendingEvents.values()) {
      this.logger.debug(`File change: ${event.type} ${event.path}`);
      this.server.emit(FILE_CHANGE_EVENT, event);
    }
    this.pendingEvents.clear();
  }

  onModuleDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.watcher) {
      this.watcher.close();
      this.logger.log('File watcher closed');
    }
  }
}
