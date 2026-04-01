import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { RequestLoggerMiddleware, RateLimitGuard } from '../common';
import { RedisModule } from '../redis/redis.module';
import { DockerModule } from '../docker/docker.module';
import { GithubAuthModule } from '../github-auth/github-auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { FileExplorerModule } from '../file-explorer/file-explorer.module';
import { GitModule } from '../git/git.module';
import { AiModule } from '../ai/ai.module';
import { TerminalModule } from '../terminal/terminal.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/nestjs-api/.env' }),
    RedisModule,
    DockerModule,
    GithubAuthModule,
    WorkspaceModule,
    FileExplorerModule,
    GitModule,
    AiModule,
    TerminalModule,
    VoiceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
