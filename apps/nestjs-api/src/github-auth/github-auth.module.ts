import { Module } from '@nestjs/common';
import { GithubApiModule } from '../github-api';
import { AuthModule } from '../auth/auth.module';
import { AppLogger } from '../common';
import { GithubAuthController } from './github-auth.controller';
import { GithubAuthService } from './github-auth.service';

@Module({
  imports: [AuthModule, GithubApiModule],
  controllers: [GithubAuthController],
  providers: [GithubAuthService, AppLogger],
})
export class GithubAuthModule {}
