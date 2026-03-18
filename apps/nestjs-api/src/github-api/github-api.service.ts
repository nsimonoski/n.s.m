import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../common';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export interface GithubProfile {
  login: string;
  avatar_url: string;
}

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);

  constructor(private readonly config: ConfigService) {}

  getAuthorizationUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_ID);
    const callbackUrl = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CALLBACK_URL);
    let url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo`;
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }
    return url;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
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

  async fetchProfile(token: string): Promise<GithubProfile> {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json() as Promise<GithubProfile>;
  }

  async isPrivateRepo(owner: string, repo: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) return true;

      const data = (await response.json()) as { private: boolean };
      return data.private;
    } catch {
      return true;
    }
  }

  async revokeGrant(token: string): Promise<void> {
    const clientId = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_ID);
    const clientSecret = this.config.getOrThrow<string>(EnvironmentVariables.OAUTH_CLIENT_SECRET);
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    await fetch(`${GITHUB_API_BASE}/applications/${clientId}/grant`, {
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
}
