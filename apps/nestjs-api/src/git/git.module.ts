import { Module } from '@nestjs/common';
import { GitController } from './git.controller';
import { GitProvider } from './domain/git.provider';
import { SimpleGitProvider } from './infrastructure/simple-git.provider';

@Module({
  controllers: [GitController],
  providers: [
    {
      provide: GitProvider,
      useClass: SimpleGitProvider,
    },
  ],
})
export class GitModule {}
