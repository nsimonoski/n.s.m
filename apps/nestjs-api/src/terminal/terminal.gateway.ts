import { OnModuleDestroy, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Terminal } from '@org/shared/contracts';
import { getCorsOrigins, createWsAuthMiddleware, AuthenticatedSocket } from '../common';
import { SessionService } from '../auth/session.service';
import { PtyProvider, PtyHandle } from './domain/pty.provider';

const MAX_SESSIONS_PER_CLIENT = 4;

@WebSocketGateway({
  cors: { origin: getCorsOrigins() },
})
export class TerminalGateway implements OnModuleDestroy {
  private readonly logger = new Logger(TerminalGateway.name);
  private readonly clientSessions = new Map<string, Map<string, PtyHandle>>();

  constructor(
    private readonly ptyProvider: PtyProvider,
    private readonly sessionService: SessionService,
  ) {}

  @WebSocketServer()
  server!: Server;

  afterInit(server: Server): void {
    server.use(createWsAuthMiddleware(this.sessionService));
  }

  @SubscribeMessage(Terminal.TERMINAL_CREATE_EVENT)
  async handleCreate(
    @MessageBody() body: Terminal.TerminalCreateRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    const session = (client as AuthenticatedSocket).data.session;
    if (!session) {
      client.emit(Terminal.TERMINAL_ERROR_EVENT, { message: 'Not authenticated' });
      return;
    }

    if (!session.containerId) {
      client.emit(Terminal.TERMINAL_ERROR_EVENT, { message: 'No workspace available' });
      return;
    }

    if (session.workspacePath && !body.cwd.startsWith(session.workspacePath)) {
      client.emit(Terminal.TERMINAL_ERROR_EVENT, { message: 'Invalid working directory' });
      return;
    }

    const sessions = this.getOrCreateSessions(client.id);
    if (sessions.size >= MAX_SESSIONS_PER_CLIENT) {
      this.logger.warn(`[${client.id}] Max sessions reached`);
      return;
    }

    try {
      const sessionId = crypto.randomUUID();
      const handle = await this.ptyProvider.createAndStartTerminal(
        body.cols,
        body.rows,
        body.cwd,
        session.containerId,
      );
      sessions.set(sessionId, handle);

      this.logger.log(`[${client.id}] Terminal session created: ${sessionId}`);

      handle.onData((data) => {
        const payload: Terminal.TerminalDataDto = { sessionId, data };
        client.emit(Terminal.TERMINAL_DATA_EVENT, payload);
      });

      handle.onExit((exitCode) => {
        const payload: Terminal.TerminalExitDto = { sessionId, exitCode };
        client.emit(Terminal.TERMINAL_EXIT_EVENT, payload);
        sessions.delete(sessionId);
      });

      const response: Terminal.TerminalCreatedResponseDto = { sessionId };
      client.emit(Terminal.TERMINAL_CREATED_EVENT, response);
    } catch (error) {
      this.logger.error(`[${client.id}] Failed to create terminal: ${(error as Error).message}`);
      client.emit(Terminal.TERMINAL_ERROR_EVENT, {
        message: 'Failed to create terminal session',
      } satisfies Terminal.TerminalErrorDto);
    }
  }

  @SubscribeMessage(Terminal.TERMINAL_DATA_EVENT)
  handleData(@MessageBody() body: Terminal.TerminalDataDto, @ConnectedSocket() client: Socket) {
    const handle = this.getSession(client.id, body.sessionId);
    handle?.write(body.data);
  }

  @SubscribeMessage(Terminal.TERMINAL_RESIZE_EVENT)
  handleResize(@MessageBody() body: Terminal.TerminalResizeDto, @ConnectedSocket() client: Socket) {
    const handle = this.getSession(client.id, body.sessionId);
    handle?.resize(body.cols, body.rows);
  }

  @SubscribeMessage(Terminal.TERMINAL_CLOSE_EVENT)
  handleClose(@MessageBody() body: Terminal.TerminalCloseDto, @ConnectedSocket() client: Socket) {
    const sessions = this.clientSessions.get(client.id);
    const handle = sessions?.get(body.sessionId);
    if (handle) {
      handle.kill();
      sessions?.delete(body.sessionId);
      this.logger.log(`[${client.id}] Terminal session closed: ${body.sessionId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.cleanupClient(client.id);
  }

  onModuleDestroy() {
    for (const clientId of this.clientSessions.keys()) {
      this.cleanupClient(clientId);
    }
    this.logger.log('All terminal sessions closed');
  }

  private getOrCreateSessions(clientId: string): Map<string, PtyHandle> {
    let sessions = this.clientSessions.get(clientId);
    if (!sessions) {
      sessions = new Map();
      this.clientSessions.set(clientId, sessions);
    }
    return sessions;
  }

  private getSession(clientId: string, sessionId: string): PtyHandle | undefined {
    return this.clientSessions.get(clientId)?.get(sessionId);
  }

  private cleanupClient(clientId: string): void {
    const sessions = this.clientSessions.get(clientId);
    if (!sessions) return;

    for (const [sessionId, handle] of sessions) {
      handle.kill();
      this.logger.debug(`[${clientId}] Cleaned up session: ${sessionId}`);
    }
    this.clientSessions.delete(clientId);
  }
}
