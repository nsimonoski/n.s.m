import { OnModuleDestroy, Logger } from '@nestjs/common';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { Server } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

import { GIT_CHANGE_EVENT, GIT_WATCH_EVENT } from '@org/shared/contracts';

const THROTTLE_MS = 1000;

const WORKING_TREE_IGNORED = [
  '/node_modules',
  '/.git',
  '/dist',
  '/.nx',
  '/.angular',
  '/.cache',
  '/tmp',
];

@WebSocketGateway({
  cors: { origin: ['http://localhost:4200', 'http://localhost:4201'] },
})
export class GitGateway implements OnModuleDestroy {
  private readonly logger = new Logger(GitGateway.name);
  private gitWatcher: chokidar.FSWatcher | null = null;
  private workingTreeWatcher: chokidar.FSWatcher | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(GIT_WATCH_EVENT)
  handleWatch(@MessageBody() repoPath: string) {
    this.closeWatchers();

    this.logger.log(`Watching git repo at ${repoPath}`);

    // Watch .git internals — catches stage, unstage, commit, branch switch
    const gitDir = path.join(repoPath, '.git');
    this.gitWatcher = chokidar.watch(
      [
        path.join(gitDir, 'index'),
        path.join(gitDir, 'HEAD'),
        path.join(gitDir, 'refs'),
        path.join(gitDir, 'MERGE_HEAD'),
        path.join(gitDir, 'REBASE_HEAD'),
      ],
      {
        ignoreInitial: true,
        persistent: true,
        ignored: (filePath: string) => filePath.endsWith('.lock'),
        depth: 3,
      },
    );

    // Watch working tree — catches new untracked files, modifications, deletions
    this.workingTreeWatcher = chokidar.watch(repoPath, {
      ignoreInitial: true,
      persistent: true,
      ignored: (filePath: string) =>
        WORKING_TREE_IGNORED.some((dir) => filePath.includes(dir)),
      depth: 10,
      usePolling: true,
      interval: 1000,
    });

    this.gitWatcher.on('all', (event, filePath) => {
      this.logger.debug(`Git internal: ${event} ${filePath}`);
      this.scheduleEmit();
    });

    this.workingTreeWatcher.on('all', (event, filePath) => {
      this.logger.debug(`Working tree: ${event} ${filePath}`);
      this.scheduleEmit();
    });
  }

  private scheduleEmit() {
    if (this.throttleTimer) return;
    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
      this.logger.debug('Emitting git change event');
      this.server.emit(GIT_CHANGE_EVENT);
    }, THROTTLE_MS);
  }

  private closeWatchers() {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
    if (this.gitWatcher) {
      this.gitWatcher.close();
      this.gitWatcher = null;
    }
    if (this.workingTreeWatcher) {
      this.workingTreeWatcher.close();
      this.workingTreeWatcher = null;
    }
  }

  onModuleDestroy() {
    this.closeWatchers();
    this.logger.log('Git watchers closed');
  }
}
