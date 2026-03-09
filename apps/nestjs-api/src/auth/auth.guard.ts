import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';

/**
 * Guard that authenticates requests via session cookie.
 * Refreshes session TTL on each request and attaches session to `request.session`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = this.extractSessionId(request);
    if (!sessionId) throw new UnauthorizedException();

    const session = await this.sessionService.findById(sessionId);
    if (!session) throw new UnauthorizedException();

    await this.sessionService.refreshTTL(sessionId);
    request.session = session;
    return true;
  }

  private extractSessionId(request: {
    cookies?: Record<string, string>;
    headers: Record<string, string>;
  }): string | null {
    return request.cookies?.['session_id'] || null;
  }
}
