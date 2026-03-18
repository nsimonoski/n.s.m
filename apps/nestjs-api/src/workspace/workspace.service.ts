import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { GitProvider } from '../git/domain/git.provider';
import { EnvironmentVariables, FileSystemService } from '../common';
import { GithubApiService } from '../github-api';
import { SessionService, UserSession } from '../auth/session.service';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly gitProvider: GitProvider,
    private readonly sessionService: SessionService,
    private readonly fileSystemService: FileSystemService,
    private readonly githubApi: GithubApiService,
    private readonly config: ConfigService,
  ) {}

  async cloneRepo(session: UserSession, repoUrl: string): Promise<WorkspaceStatusDto> {
    if (!repoUrl.includes('github.com')) {
      throw new BadRequestException('Only GitHub repositories are supported');
    }

    const { owner, repo } = this.parseGithubUrl(repoUrl);
    const isPrivate = session.githubToken
      ? await this.githubApi.isPrivateRepo(owner, repo, session.githubToken)
      : false;

    const workspacePath = this.sessionService.getWorkspacePath(session.id, isPrivate);
    await this.prepareWorkspace(workspacePath);

    const authedUrl = session.githubToken
      ? repoUrl.replace('https://', `https://${session.githubToken}@`)
      : repoUrl;

    this.logger.log(`Cloning ${repoUrl} into ${workspacePath} (private: ${isPrivate})`);
    await this.gitProvider.clone(authedUrl, workspacePath);
    await this.gitProvider.setRemoteUrl(workspacePath, 'origin', repoUrl);
    await this.gitProvider.configUser(
      workspacePath,
      session.githubUsername,
      `${session.githubUsername}@users.noreply.github.com`,
    );

    const updated = await this.sessionService.initializeWorkspace(session.id, repoUrl, isPrivate);
    return this.getWorkspace(updated);
  }

  async cloneDemoRepo(session: UserSession): Promise<WorkspaceStatusDto> {
    const demoRepoUrl = this.config.get<string>(EnvironmentVariables.DEMO_REPO_URL);
    if (!demoRepoUrl) {
      throw new Error('DEMO_REPO_URL is required for guest sessions');
    }

    const workspacePath = this.sessionService.getWorkspacePath(session.id, false);
    await this.prepareWorkspace(workspacePath);

    this.logger.log(`Cloning demo repo for guest session ${session.id}`);
    await this.gitProvider.clone(demoRepoUrl, workspacePath);
    await this.gitProvider.checkout(workspacePath, 'dev');

    const updated = await this.sessionService.initializeWorkspace(session.id, demoRepoUrl, false);
    return this.getWorkspace(updated);
  }

  getWorkspace(session: UserSession): WorkspaceStatusDto {
    return {
      repoUrl: session.repoUrl,
      repoName: session.repoUrl ? this.extractRepoName(session.repoUrl) : null,
      rootPath: session.workspacePath ?? '',
      ready: session.repoUrl !== null,
    };
  }

  private extractRepoName(repoUrl: string): string {
    const parts = repoUrl.replace(/\.git$/, '').split('/');
    return parts[parts.length - 1];
  }

  private async prepareWorkspace(workspacePath: string): Promise<void> {
    try {
      await this.fileSystemService.removeDirectory(workspacePath);
      await this.fileSystemService.createDirectory(workspacePath, true);
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  private parseGithubUrl(repoUrl: string): { owner: string; repo: string } {
    const cleaned = repoUrl.replace(/\.git$/, '');
    const parts = cleaned.split('/');
    return {
      owner: parts[parts.length - 2],
      repo: parts[parts.length - 1],
    };
  }
}
