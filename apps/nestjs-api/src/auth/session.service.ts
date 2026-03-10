import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EnvironmentVariables, PathUtils, FileSystemService } from '../common';
import { RedisService } from '../redis/redis.service';

export interface UserSession {
  id: string;
  githubToken: string | null;
  githubUsername: string;
  avatarUrl: string;
  workspacePath: string;
  repoUrl: string | null;
  isGuest: boolean;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 30 * 60;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly workspaceBase: string;
  private readonly demoWorkspacePath: string;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly fileSystemService: FileSystemService,
  ) {
    this.workspaceBase = this.config.get<string>(EnvironmentVariables.WORKSPACE_BASE_DIR, '/tmp/workspaces');
    this.demoWorkspacePath = this.config.get<string>(EnvironmentVariables.DEMO_WORKSPACE_PATH)
      || PathUtils.combine(this.workspaceBase, 'demo');
    this.cleanupTimer = setInterval(() => this.cleanupOrphanedWorkspaces(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async createAuthenticatedSession(
    githubToken: string,
    githubUsername: string,
    avatarUrl: string,
  ): Promise<UserSession> {
    const id = randomUUID();
    const workspacePath = PathUtils.combine(this.workspaceBase, id);
    await this.fileSystemService.createDirectory(workspacePath, true);

    const session: UserSession = {
      id,
      githubToken,
      githubUsername,
      avatarUrl,
      workspacePath,
      repoUrl: null,
      isGuest: false,
    };

    await this.redis.set(`${SESSION_PREFIX}${id}`, session, SESSION_TTL_SECONDS);
    return session;
  }

  async createGuestSession(): Promise<UserSession> {
    const id = randomUUID();

    const session: UserSession = {
      id,
      githubToken: null,
      githubUsername: 'guest',
      avatarUrl: '',
      workspacePath: this.demoWorkspacePath,
      repoUrl: this.config.get<string>(EnvironmentVariables.DEMO_REPO_URL) || null,
      isGuest: true,
    };

    await this.redis.set(`${SESSION_PREFIX}${id}`, session, SESSION_TTL_SECONDS);
    return session;
  }

  async findById(id: string): Promise<UserSession | null> {
    return this.redis.get<UserSession>(`${SESSION_PREFIX}${id}`);
  }

  async refreshTTL(id: string): Promise<void> {
    await this.redis.resetTTL(`${SESSION_PREFIX}${id}`, SESSION_TTL_SECONDS);
  }

  async save(session: UserSession): Promise<void> {
    await this.redis.set(`${SESSION_PREFIX}${session.id}`, session, SESSION_TTL_SECONDS);
  }

  async destroySessionAndCleanWorkspace(id: string): Promise<void> {
    const session = await this.findById(id);
    if (!session) return;

    await this.redis.del(`${SESSION_PREFIX}${id}`);

    if (!session.isGuest && session.workspacePath !== this.demoWorkspacePath) {
      await this.fileSystemService.removeDirectory(session.workspacePath).catch(() => { /* cleanup best-effort */ });
    }
  }

  private async cleanupOrphanedWorkspaces(): Promise<void> {
    try {
      await this.fileSystemService.createDirectory(this.workspaceBase, true);
      const dirs = await this.fileSystemService.listDirectory(this.workspaceBase);

      for (const dir of dirs) {
        if (dir === 'demo') continue;

        const sessionExists = await this.redis.get(`${SESSION_PREFIX}${dir}`);
        if (!sessionExists) {
          const fullPath = PathUtils.combine(this.workspaceBase, dir);
          await this.fileSystemService.removeDirectory(fullPath);
          this.logger.log(`Cleaned up orphaned workspace: ${dir}`);
        }
      }
    } catch {
      // workspace dir may not exist yet
    }
  }
}
