import { Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { UserProfileDto } from '@org/shared/contracts';
import { GUEST_PERMISSIONS } from '@org/shared/contracts';
import { EnvironmentVariables, RateLimitAuth } from '../common';
import { AuthGuard } from '../auth/auth.guard';
import { UserSession } from '../auth/session.service';
import { GithubAuthService } from './github-auth.service';

@RateLimitAuth()
@Controller('auth')
export class GithubAuthController {
  constructor(
    private readonly authService: GithubAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('github')
  redirectToGithub(@Query('app') app: string, @Res() res: Response) {
    res.redirect(this.authService.getAuthorizationUrl(app));
  }

  @Get('github/callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const session = await this.authService.authenticateWithCode(code);
    this.setSessionCookie(res, session.id);

    const frontendUrl = this.resolveFrontendUrl(state);
    res.redirect(`${frontendUrl}/ide/clone-repo`);
  }

  @Get('guest')
  async guestLogin(@Res() res: Response) {
    const session = await this.authService.createGuestSession();
    this.setSessionCookie(res, session.id);
    res.json({
      username: session.githubUsername,
      avatarUrl: session.avatarUrl,
      isGuest: true,
      permissions: GUEST_PERMISSIONS,
    });
  }

  @Get('login-info')
  async getLoginInfo(@Req() req: Request): Promise<UserProfileDto | null> {
    return this.authService.getLoginInfo(req.cookies?.['session_id']);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request & { session: UserSession }, @Res() res: Response) {
    await this.authService.logout(req.session.id);
    res.clearCookie('session_id');
    res.json({ ok: true });
  }

  private resolveFrontendUrl(app?: string): string {
    if (app === 'react') {
      return this.config.get<string>(
        EnvironmentVariables.REACT_IDE_URL,
        'http://localhost:4201/react',
      );
    }
    return this.config.get<string>(
      EnvironmentVariables.ANGULAR_IDE_URL,
      'http://localhost:4200/angular',
    );
  }

  private setSessionCookie(res: Response, sessionId: string): void {
    const isProduction = this.config.get<string>(EnvironmentVariables.NODE_ENV) === 'production';
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000,
    });
  }
}
