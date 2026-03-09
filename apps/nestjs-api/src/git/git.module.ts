import { Module } from '@nestjs/common';
import { GitController } from './git.controller';
import { GitGateway } from './git.gateway';
import { GitProvider } from './domain/git.provider';
import { SimpleGitProvider } from './infrastructure/simple-git.provider';
import { FileWatcherService } from '../common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GitController],
  providers: [
    {
      provide: GitProvider,
      useClass: SimpleGitProvider,
    },
    FileWatcherService,
    GitGateway,
  ],
})
export class GitModule {}
