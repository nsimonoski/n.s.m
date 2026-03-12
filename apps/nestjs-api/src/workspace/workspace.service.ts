import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { WorkspaceStatusDto } from '@org/shared/contracts';
import { GitProvider } from '../git/domain/git.provider';
import { FileSystemService } from '../common';
import { SessionService, UserSession } from '../auth/session.service';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly gitProvider: GitProvider,
    private readonly sessionService: SessionService,
    private readonly fileSystemService: FileSystemService,
  ) {}

  async cloneRepo(session: UserSession, repoUrl: string): Promise<WorkspaceStatusDto> {
    if (session.isGuest) {
      throw new BadRequestException('Guest users cannot clone repositories');
    }

    if (!repoUrl.includes('github.com')) {
      throw new BadRequestException('Only GitHub repositories are supported');
    }

    try {
      await this.fileSystemService.removeDirectory(session.workspacePath);
      await this.fileSystemService.createDirectory(session.workspacePath, true);
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }

    const authedUrl = repoUrl.replace('https://', `https://${session.githubToken}@`);

    this.logger.log(`Cloning ${repoUrl} into ${session.workspacePath}`);
    await this.gitProvider.clone(authedUrl, session.workspacePath);
    await this.gitProvider.configUser(
      session.workspacePath,
      session.githubUsername,
      `${session.githubUsername}@users.noreply.github.com`,
    );

    const userBranch = `user/${session.githubUsername}`;
    await this.gitProvider.checkoutOrCreateBranch(session.workspacePath, userBranch);

    session.repoUrl = repoUrl;
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
}
