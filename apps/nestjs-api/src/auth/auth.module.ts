import { Module } from '@nestjs/common';
import { FileSystemService } from '../common';
import { GitProvider } from '../git/domain/git.provider';
import { SimpleGitProvider } from '../git/infrastructure/simple-git.provider';
import { AuthGuard } from './auth.guard';
import { SessionService } from './session.service';

@Module({
  providers: [
    SessionService,
    AuthGuard,
    FileSystemService,
    { provide: GitProvider, useClass: SimpleGitProvider },
  ],
  exports: [SessionService, AuthGuard],
})
export class AuthModule {}
