import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PtyProvider } from './domain/pty.provider';
import { DockerPtyProvider } from './infrastructure/docker-pty.provider';
import { TerminalGateway } from './terminal.gateway';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: PtyProvider,
      useClass: DockerPtyProvider,
    },
    TerminalGateway,
  ],
})
export class TerminalModule {}
