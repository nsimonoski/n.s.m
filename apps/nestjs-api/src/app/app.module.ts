import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RequestLoggerMiddleware } from '../common';
import { RedisModule } from '../redis/redis.module';
import { GithubAuthModule } from '../github-auth/github-auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { FileExplorerModule } from '../file-explorer/file-explorer.module';
import { GitModule } from '../git/git.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/nestjs-api/.env' }),
    RedisModule,
    GithubAuthModule,
    WorkspaceModule,
    FileExplorerModule,
    GitModule,
    AiModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
