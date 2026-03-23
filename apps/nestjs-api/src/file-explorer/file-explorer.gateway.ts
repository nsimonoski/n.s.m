import { OnModuleDestroy, Logger } from '@nestjs/common';
import type { FSWatcher } from 'chokidar';
import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import type { FileChangeEvent } from '@org/shared/contracts';
import { FILE_CHANGE_EVENT, FILE_WATCH_EVENT } from '@org/shared/contracts';
import { getCorsOrigins, FileWatcherService, createWsAuthMiddleware } from '../common';
import { SessionService } from '../auth/session.service';

const DEBOUNCE_MS = 500;

interface ClientWatcher {
  watcher: FSWatcher;
  pendingEvents: Map<string, FileChangeEvent>;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

@WebSocketGateway({ cors: { origin: getCorsOrigins() } })
export class FileExplorerGateway implements OnModuleDestroy {
  private readonly logger = new Logger(FileExplorerGateway.name);
  private readonly clientWatchers = new Map<string, ClientWatcher>();

  constructor(
    private readonly fileWatcherService: FileWatcherService,
    private readonly sessionService: SessionService,
  ) {}

  afterInit(server: Server): void {
    server.use(createWsAuthMiddleware(this.sessionService));
  }

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(FILE_WATCH_EVENT)
  watchDirectoryForChanges(@MessageBody() watchPath: string, @ConnectedSocket() client: Socket) {
    // Close any existing watcher for this client before creating a new one
    this.stopWatching(client.id);

    this.logger.log(`[${client.id}] Watching file system at ${watchPath}`);

    const watcher = this.fileWatcherService.watchRepositoryForChanges(watchPath);

    const state: ClientWatcher = { watcher, pendingEvents: new Map(), debounceTimer: null };
    this.clientWatchers.set(client.id, state);

    watcher.on('all', (eventType, filePath) => {
      const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
      state.pendingEvents.set(parentPath, {
        type: eventType as FileChangeEvent['type'],
        path: filePath,
      });

      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
      }
      state.debounceTimer = setTimeout(() => {
        for (const event of state.pendingEvents.values()) {
          this.logger.debug(`[${client.id}] File change: ${event.type} ${event.path}`);
          client.emit(FILE_CHANGE_EVENT, event);
        }
        state.pendingEvents.clear();
      }, DEBOUNCE_MS);
    });
  }

  handleDisconnect(client: Socket) {
    this.stopWatching(client.id);
  }

  onModuleDestroy() {
    for (const clientId of this.clientWatchers.keys()) {
      this.stopWatching(clientId);
    }
    this.logger.log('All file watchers closed');
  }

  private stopWatching(clientId: string): void {
    const state = this.clientWatchers.get(clientId);
    if (!state) return;

    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.watcher.close();
    this.clientWatchers.delete(clientId);
  }
}
