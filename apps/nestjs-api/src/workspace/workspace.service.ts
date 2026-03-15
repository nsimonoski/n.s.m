import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { GitProvider } from '../git/domain/git.provider';
import { EnvironmentVariables, FileSystemService } from '../common';
import { SessionService, UserSession } from '../auth/session.service';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly gitProvider: GitProvider,
    private readonly sessionService: SessionService,
    private readonly fileSystemService: FileSystemService,
    private readonly config: ConfigService,
  ) {}

  async cloneRepo(session: UserSession, repoUrl: string): Promise<WorkspaceStatusDto> {
    if (!repoUrl.includes('github.com')) {
      throw new BadRequestException('Only GitHub repositories are supported');
    }

    await this.prepareWorkspace(session.workspacePath);

    const authedUrl = session.githubToken
      ? repoUrl.replace('https://', `https://${session.githubToken}@`)
      : repoUrl;

    this.logger.log(`Cloning ${repoUrl} into ${session.workspacePath}`);
    await this.gitProvider.clone(authedUrl, session.workspacePath);
    await this.gitProvider.configUser(
      session.workspacePath,
      session.githubUsername,
      `${session.githubUsername}@users.noreply.github.com`,
    );

    session.repoUrl = repoUrl;
    await this.sessionService.save(session);

    return this.getWorkspace(session);
  }

  async cloneDemoRepo(session: UserSession): Promise<WorkspaceStatusDto> {
    const demoRepoUrl = this.config.get<string>(EnvironmentVariables.DEMO_REPO_URL);
    if (!demoRepoUrl) {
      throw new Error('DEMO_REPO_URL is required for guest sessions');
    }

    this.logger.log(`Cloning demo repo for guest session ${session.id}`);
    await this.gitProvider.clone(demoRepoUrl, session.workspacePath);
    await this.gitProvider.checkout(session.workspacePath, 'dev');

    session.repoUrl = demoRepoUrl;
    await this.sessionService.save(session);

    return this.getWorkspace(session);
  }

  getWorkspace(session: UserSession): WorkspaceStatusDto {
    return {
      repoUrl: session.repoUrl,
      repoName: session.repoUrl ? this.extractRepoName(session.repoUrl) : null,
      rootPath: session.workspacePath,
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
}
