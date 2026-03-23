import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PtyProvider } from './domain/pty.provider';
import { NodePtyProvider } from './infrastructure/node-pty.provider';
import { TerminalGateway } from './terminal.gateway';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: PtyProvider,
      useClass: NodePtyProvider,
    },
    TerminalGateway,
  ],
})
export class TerminalModule {}
