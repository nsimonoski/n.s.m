import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { GithubAuthController } from './github-auth.controller';
import { GithubAuthService } from './github-auth.service';

@Module({
  imports: [AuthModule, WorkspaceModule],
  controllers: [GithubAuthController],
  providers: [GithubAuthService],
})
export class GithubAuthModule {}
