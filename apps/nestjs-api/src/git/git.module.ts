import { Module } from '@nestjs/common';
import { GitController } from './git.controller';
import { GitGateway } from './git.gateway';
import { GitProvider } from './domain/git.provider';
import { SimpleGitProvider } from './infrastructure/simple-git.provider';

@Module({
  controllers: [GitController],
  providers: [
    {
      provide: GitProvider,
      useClass: SimpleGitProvider,
    },
    GitGateway,
  ],
})
export class GitModule {}
