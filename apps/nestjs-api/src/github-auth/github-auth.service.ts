import { Injectable, Logger } from '@nestjs/common';
import { GUEST_PERMISSIONS, AUTH_PERMISSIONS } from '@org/shared/contracts';
import type { UserProfileDto } from '@org/shared/contracts';
import { GithubApiService } from '../github-api';
import { SessionService, UserSession } from '../auth/session.service';

@Injectable()
export class GithubAuthService {
  private readonly logger = new Logger(GithubAuthService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly githubApi: GithubApiService,
  ) {}

  getAuthorizationUrl(): string {
    return this.githubApi.getAuthorizationUrl();
  }

  async authenticateWithCode(code: string): Promise<UserSession> {
    const githubToken = await this.githubApi.exchangeCodeForToken(code);
    const profile = await this.githubApi.fetchProfile(githubToken);
    return this.sessionService.createSession({
      githubToken,
      githubUsername: profile.login,
      avatarUrl: profile.avatar_url,
      isGuest: false,
    });
  }

  async createGuestSession(): Promise<UserSession> {
    return this.sessionService.createSession({
      githubToken: null,
      githubUsername: 'guest',
      avatarUrl: '',
      isGuest: true,
    });
  }

  async getLoginInfo(sessionId: string | undefined): Promise<UserProfileDto | null> {
    if (!sessionId) return null;

    const session = await this.sessionService.findById(sessionId);
    if (!session) return null;

    await this.sessionService.refreshTTL(sessionId);

    return {
      username: session.githubUsername,
      avatarUrl: session.avatarUrl,
      repoUrl: session.repoUrl,
      isGuest: session.isGuest,
      permissions: session.isGuest ? GUEST_PERMISSIONS : AUTH_PERMISSIONS,
    };
  }

  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionService.findById(sessionId);
    if (session?.githubToken) {
      await this.githubApi.revokeGrant(session.githubToken);
    }
    await this.sessionService.destroySessionAndCleanWorkspace(sessionId);
  }
}
