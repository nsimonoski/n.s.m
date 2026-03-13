import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LoginInfoDto } from '@org/shared/contracts';
import { GUEST_PERMISSIONS, AUTH_PERMISSIONS } from '@org/shared/contracts';
import { EnvironmentVariables } from '../common';
import { SessionService, UserSession } from '../auth/session.service';
import { WorkspaceService } from '../workspace/workspace.service';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

interface GithubProfile {
  login: string;
  avatar_url: string;
}

@Injectable()
export class GithubAuthService {
  private readonly logger = new Logger(GithubAuthService.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly workspaceService: WorkspaceService,
    private readonly config: ConfigService,
  ) {}

  getAuthorizationUrl(): string {
    const clientId = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_ID);
    const callbackUrl = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CALLBACK_URL);
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo`;
  }

  async authenticateWithCode(code: string): Promise<UserSession> {
    const githubToken = await this.exchangeCodeForToken(code);
    const profile = await this.fetchGithubProfile(githubToken);
    return this.sessionService.createSession({
      githubToken,
      githubUsername: profile.login,
      avatarUrl: profile.avatar_url,
      isGuest: false,
    });
  }

  async createGuestSession(): Promise<UserSession> {
    const session = await this.sessionService.createSession({
      githubToken: null,
      githubUsername: 'guest',
      avatarUrl: '',
      isGuest: true,
    });
    await this.workspaceService.cloneDemoRepo(session);
    return session;
  }

  async getLoginInfo(sessionId: string | undefined): Promise<LoginInfoDto | null> {
    if (!sessionId) return null;

    const session = await this.sessionService.findById(sessionId);
    if (!session) return null;

    await this.sessionService.refreshTTL(sessionId);

    return {
      profile: {
        username: session.githubUsername,
        avatarUrl: session.avatarUrl,
        repoUrl: session.repoUrl,
        isGuest: session.isGuest,
        permissions: session.isGuest ? GUEST_PERMISSIONS : AUTH_PERMISSIONS,
      },
      workspace: this.workspaceService.getWorkspace(session),
    };
  }

  async logout(sessionId: string): Promise<void> {
    const session = await this.sessionService.findById(sessionId);
    if (session?.githubToken) {
      await this.revokeGithubGrant(session.githubToken);
    }
    await this.sessionService.destroySessionAndCleanWorkspace(sessionId);
  }

  private async revokeGithubGrant(token: string): Promise<void> {
    const clientId = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_ID);
    const clientSecret = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_SECRET);
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    await fetch(`https://api.github.com/applications/${clientId}/grant`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    }).catch((error) => {
      this.logger.warn(`Failed to revoke GitHub grant: ${error.message}`);
    });
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_ID),
        client_secret: this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_SECRET),
        code,
      }),
    });

    const data = (await response.json()) as { access_token: string; error?: string };
    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error}`);
    }
    return data.access_token;
  }

  private async fetchGithubProfile(token: string): Promise<GithubProfile> {
    const response = await fetch(GITHUB_USER_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json() as Promise<GithubProfile>;
  }
}
