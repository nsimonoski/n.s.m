import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Permission } from '@org/shared/contracts';
import { PermissionGuard } from '../common';
import { AuthGuard } from '../auth/auth.guard';
import { UserSession } from '../auth/session.service';
import { WorkspaceService } from './workspace.service';

@UseGuards(AuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('clone')
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async clone(@Req() req: Request & { session: UserSession }, @Body('repoUrl') repoUrl: string) {
    return this.workspaceService.cloneRepo(req.session, repoUrl);
  }

  @Post('clone-demo')
  async cloneDemo(@Req() req: Request & { session: UserSession }) {
    return this.workspaceService.cloneDemoRepo(req.session);
  }
}
