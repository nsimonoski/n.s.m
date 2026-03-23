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

import { GIT_CHANGE_EVENT, GIT_WATCH_EVENT } from '@org/shared/contracts';
import { GitTreeUtils } from '@org/shared/utils';
import { getCorsOrigins, FileWatcherService, createWsAuthMiddleware } from '../common';
import { SessionService } from '../auth/session.service';
import { GitProvider } from './domain/git.provider';

const THROTTLE_MS = 1000;

interface ClientWatchers {
  gitWatcher: FSWatcher;
  workingTreeWatcher: FSWatcher;
  throttleTimer: ReturnType<typeof setTimeout> | null;
}

@WebSocketGateway({
  cors: { origin: getCorsOrigins() },
})
export class GitGateway implements OnModuleDestroy {
  private readonly logger = new Logger(GitGateway.name);
  private readonly clientWatchers = new Map<string, ClientWatchers>();

  constructor(
    private readonly gitProvider: GitProvider,
    private readonly fileWatcherService: FileWatcherService,
    private readonly sessionService: SessionService,
  ) {}

  afterInit(server: Server): void {
    server.use(createWsAuthMiddleware(this.sessionService));
  }

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(GIT_WATCH_EVENT)
  watchRepositoryForChanges(@MessageBody() repoPath: string, @ConnectedSocket() client: Socket) {
    this.stopWatching(client.id);

    this.logger.log(`[${client.id}] Watching git repo at ${repoPath}`);

    const gitWatcher = this.fileWatcherService.watchGitForChanges(repoPath);
    const workingTreeWatcher = this.fileWatcherService.watchRepositoryForChanges(repoPath);

    const watchers: ClientWatchers = { gitWatcher, workingTreeWatcher, throttleTimer: null };
    this.clientWatchers.set(client.id, watchers);

    const scheduleEmit = () => {
      if (watchers.throttleTimer) return;
      watchers.throttleTimer = setTimeout(async () => {
        watchers.throttleTimer = null;
        if (!this.clientWatchers.has(client.id)) return;
        try {
          const status = await this.gitProvider.status(repoPath);
          const payload = {
            branch: status.branch,
            tracking: status.tracking,
            tree: GitTreeUtils.buildGitChangesTree(status),
            statusMap: GitTreeUtils.buildGitStatusMap(status),
            ahead: status.ahead,
            behind: status.behind,
            stagedCount: status.staged.length,
            changesCount: status.unstaged.length + status.untracked.length,
          };
          client.emit(GIT_CHANGE_EVENT, payload);
        } catch {
          this.stopWatching(client.id);
        }
      }, THROTTLE_MS);
    };

    gitWatcher.on('all', (event, filePath) => {
      this.logger.debug(`[${client.id}] Git internal: ${event} ${filePath}`);
      scheduleEmit();
    });

    workingTreeWatcher.on('all', (event, filePath) => {
      this.logger.debug(`[${client.id}] Working tree: ${event} ${filePath}`);
      scheduleEmit();
    });
  }

  handleDisconnect(client: Socket) {
    this.stopWatching(client.id);
  }

  onModuleDestroy() {
    for (const clientId of this.clientWatchers.keys()) {
      this.stopWatching(clientId);
    }
    this.logger.log('All git watchers closed');
  }

  private stopWatching(clientId: string): void {
    const watchers = this.clientWatchers.get(clientId);
    if (!watchers) return;

    if (watchers.throttleTimer) {
      clearTimeout(watchers.throttleTimer);
    }
    watchers.gitWatcher.close();
    watchers.workingTreeWatcher.close();
    this.clientWatchers.delete(clientId);
  }
}
