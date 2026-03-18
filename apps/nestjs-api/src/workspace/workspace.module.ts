import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GitProvider } from '../git/domain/git.provider';
import { SimpleGitProvider } from '../git/infrastructure/simple-git.provider';
import { FileSystemService } from '../common';
import { GithubApiModule } from '../github-api';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [AuthModule, GithubApiModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    FileSystemService,
    {
      provide: GitProvider,
      useClass: SimpleGitProvider,
    },
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
