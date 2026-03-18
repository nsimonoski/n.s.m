import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EnvironmentVariables, PathUtils, FileSystemService, CryptoService } from '../common';
import { RedisService } from '../redis/redis.service';

export interface UserSession {
  id: string;
  githubToken: string | null;
  githubUsername: string;
  avatarUrl: string;
  workspacePath: string | null;
  repoUrl: string | null;
  isGuest: boolean;
  isPrivateRepo: boolean;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 30 * 60;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SessionService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionService.name);
  private readonly publicWorkspaceBase: string;
  private readonly privateWorkspaceBase: string;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly fileSystemService: FileSystemService,
    private readonly cryptoService: CryptoService,
  ) {
    this.publicWorkspaceBase = this.config.get<string>(
      EnvironmentVariables.WORKSPACE_BASE_DIR,
      '/tmp/workspaces',
    );
    this.privateWorkspaceBase = this.config.get<string>(
      EnvironmentVariables.PRIVATE_WORKSPACE_BASE_DIR,
      '/tmp/private-workspaces',
    );
    this.cleanupTimer = setInterval(() => this.cleanupOrphanedWorkspaces(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  async createSession(
    params: Pick<UserSession, 'githubUsername' | 'avatarUrl' | 'isGuest'> & {
      githubToken: string | null;
    },
  ): Promise<UserSession> {
    const id = randomUUID();

    const session: UserSession = {
      id,
      githubToken: params.githubToken,
      githubUsername: params.githubUsername,
      avatarUrl: params.avatarUrl,
      workspacePath: null,
      repoUrl: null,
      isGuest: params.isGuest,
      isPrivateRepo: false,
    };

    await this.persistSession(session);
    return session;
  }

  getWorkspacePath(sessionId: string, isPrivate: boolean): string {
    const base = isPrivate ? this.privateWorkspaceBase : this.publicWorkspaceBase;
    return PathUtils.combine(base, sessionId);
  }

  async initializeWorkspace(
    sessionId: string,
    repoUrl: string,
    isPrivate: boolean,
  ): Promise<UserSession> {
    const session = await this.findById(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const updated: UserSession = {
      ...session,
      workspacePath: this.getWorkspacePath(sessionId, isPrivate),
      repoUrl,
      isPrivateRepo: isPrivate,
    };

    await this.persistSession(updated);
    return updated;
  }

  async findById(id: string): Promise<UserSession | null> {
    const session = await this.redis.get<UserSession>(`${SESSION_PREFIX}${id}`);
    if (!session) return null;

    if (session.githubToken) {
      session.githubToken = this.cryptoService.decrypt(session.githubToken);
    }

    return session;
  }

  async refreshTTL(id: string): Promise<void> {
    await this.redis.resetTTL(`${SESSION_PREFIX}${id}`, SESSION_TTL_SECONDS);
  }

  async destroySessionAndCleanWorkspace(id: string): Promise<void> {
    const session = await this.findById(id);
    if (!session) return;

    await this.redis.del(`${SESSION_PREFIX}${id}`);
    if (session.workspacePath) {
      await this.fileSystemService.removeDirectory(session.workspacePath).catch((error) => {
        this.logger.warn(`Failed to remove workspace directory: ${error.message}`);
      });
    }
  }

  private async persistSession(session: UserSession): Promise<void> {
    const toStore = { ...session };

    if (toStore.githubToken) {
      toStore.githubToken = this.cryptoService.encrypt(toStore.githubToken);
    }

    await this.redis.set(`${SESSION_PREFIX}${session.id}`, toStore, SESSION_TTL_SECONDS);
  }

  private async cleanupOrphanedWorkspaces(): Promise<void> {
    for (const base of [this.publicWorkspaceBase, this.privateWorkspaceBase]) {
      await this.cleanupDirectory(base);
    }
  }

  private async cleanupDirectory(base: string): Promise<void> {
    try {
      await this.fileSystemService.createDirectory(base, true);
      const dirs = await this.fileSystemService.listDirectory(base);

      for (const dir of dirs) {
        const sessionExists = await this.redis.get(`${SESSION_PREFIX}${dir}`);
        if (!sessionExists) {
          const fullPath = PathUtils.combine(base, dir);
          await this.fileSystemService.removeDirectory(fullPath);
          this.logger.log(`Cleaned up orphaned workspace: ${dir}`);
        }
      }
    } catch {
      // workspace dir may not exist yet
    }
  }
}
