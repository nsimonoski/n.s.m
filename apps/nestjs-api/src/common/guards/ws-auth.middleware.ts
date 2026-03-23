import type { Socket } from 'socket.io';
import type { SessionService, UserSession } from '../../auth/session.service';

type NextFn = (err?: Error) => void;

export type AuthenticatedSocket = Socket & {
  data: { session?: UserSession };
};

export function createWsAuthMiddleware(sessionService: SessionService) {
  return async (socket: Socket, next: NextFn) => {
    const cookieHeader = socket.handshake.headers.cookie ?? '';
    const sessionId = parseCookie(cookieHeader, 'session_id');

    if (!sessionId) {
      return next(new Error('Authentication required'));
    }

    const session = await sessionService.findById(sessionId);
    if (!session) {
      return next(new Error('Invalid session'));
    }

    await sessionService.refreshTTL(sessionId);
    (socket as AuthenticatedSocket).data.session = session;
    next();
  };
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
