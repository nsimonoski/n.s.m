import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@org/shared/contracts';
import type {
  GitBranchDto,
  GitCheckoutRequestDto,
  GitCloneRequestDto,
  GitCommitRequestDto,
  GitCreateBranchRequestDto,
  GitLogEntryDto,
  GitPullRequestDto,
  GitPushRequestDto,
  GitShowResponseDto,
  GitStageRequestDto,
  GitStatusDto,
  GitStatusTreeResponseDto,
} from '@org/shared/contracts';
import { GitTreeUtils } from '@org/shared/utils';
import { PermissionGuard, RateLimitRead, RateLimitWrite } from '../common';
import { AuthGuard } from '../auth/auth.guard';
import type { UserSession } from '../auth/session.service';
import { GitProvider } from './domain/git.provider';

@RateLimitRead()
@UseGuards(AuthGuard)
@Controller('git')
export class GitController {
  constructor(private readonly service: GitProvider) {}

  @Get('status')
  async status(@Query('path') path: string): Promise<GitStatusDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.status(path);
  }

  @Get('status/tree')
  async statusTree(@Query('path') path: string): Promise<GitStatusTreeResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    const status = await this.service.status(path);
    return {
      branch: status.branch,
      tracking: status.tracking,
      tree: GitTreeUtils.buildGitChangesTree(status),
      statusMap: GitTreeUtils.buildGitStatusMap(status),
      ahead: status.ahead,
      behind: status.behind,
      stagedCount: status.staged.length,
      changesCount: status.unstaged.length + status.untracked.length,
    };
  }

  @Get('branches')
  async branches(@Query('path') path: string): Promise<GitBranchDto[]> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.listBranches(path);
  }

  @Get('log')
  async log(
    @Query('path') path: string,
    @Query('limit') limit?: string,
  ): Promise<GitLogEntryDto[]> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.log(path, limit ? parseInt(limit, 10) : undefined);
  }

  @RateLimitWrite()
  @Post('clone')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async clone(@Body() body: GitCloneRequestDto): Promise<void> {
    if (!body.url || !body.path) {
      throw new BadRequestException('URL and path are required');
    }

    return this.service.clone(body.url, body.path);
  }

  @RateLimitWrite()
  @Post('checkout')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async checkout(@Query('path') path: string, @Body() body: GitCheckoutRequestDto): Promise<void> {
    if (!path || !body.branch) {
      throw new BadRequestException('Path and branch are required');
    }

    return this.service.checkout(path, body.branch);
  }

  @RateLimitWrite()
  @Post('create-branch')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async createBranch(
    @Query('path') path: string,
    @Body() body: GitCreateBranchRequestDto,
  ): Promise<void> {
    if (!path || !body.branch) {
      throw new BadRequestException('Path and branch are required');
    }

    return this.service.checkoutOrCreateBranch(path, body.branch, body.sourceBranch);
  }

  @RateLimitWrite()
  @Post('fetch')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async fetch(@Query('path') path: string, @Req() req: { session: UserSession }): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.fetch(path, req.session.githubToken ?? undefined);
  }

  @RateLimitWrite()
  @Post('pull')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async pull(
    @Query('path') path: string,
    @Body() body: GitPullRequestDto,
    @Req() req: { session: UserSession },
  ): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.pull(path, body.remote, body.branch, req.session.githubToken ?? undefined);
  }

  @RateLimitWrite()
  @Post('push')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async push(
    @Query('path') path: string,
    @Body() body: GitPushRequestDto,
    @Req() req: { session: UserSession },
  ): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.push(path, body.remote, body.branch, req.session.githubToken ?? undefined);
  }

  @RateLimitWrite()
  @Post('commit')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async commit(
    @Query('path') path: string,
    @Body() body: GitCommitRequestDto,
  ): Promise<GitLogEntryDto> {
    if (!path || !body.message) {
      throw new BadRequestException('Path and message are required');
    }

    return this.service.commit(path, body.message);
  }

  @RateLimitWrite()
  @Post('stage')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async stage(@Query('path') path: string, @Body() body: GitStageRequestDto): Promise<void> {
    if (!path || !body.paths?.length) {
      throw new BadRequestException('Path and file paths are required');
    }

    return this.service.stage(path, body.paths);
  }

  @RateLimitWrite()
  @Post('unstage')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async unstage(@Query('path') path: string, @Body() body: GitStageRequestDto): Promise<void> {
    if (!path || !body.paths?.length) {
      throw new BadRequestException('Path and file paths are required');
    }

    return this.service.unstage(path, body.paths);
  }

  @RateLimitWrite()
  @Post('discard')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async discard(@Query('path') path: string, @Body() body: GitStageRequestDto): Promise<void> {
    if (!path || !body.paths?.length) {
      throw new BadRequestException('Path and file paths are required');
    }

    return this.service.discard(path, body.paths);
  }

  @RateLimitWrite()
  @Post('stash')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async stash(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.stash(path);
  }

  @RateLimitWrite()
  @Post('stash/pop')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async stashPop(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.stashPop(path);
  }

  @RateLimitWrite()
  @Post('stash/apply')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async stashApply(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.stashApply(path);
  }

  @Get('show')
  async showDiff(
    @Query('path') path: string,
    @Query('filePath') filePath: string,
    @Query('ref') ref?: string,
  ): Promise<GitShowResponseDto> {
    if (!path || !filePath) {
      throw new BadRequestException('Path and filePath are required');
    }

    const content = await this.service.showDiff(path, filePath, ref);
    return { content };
  }

  @RateLimitWrite()
  @Post('undo-commit')
  @UseGuards(PermissionGuard(Permission.GitWrite))
  async undoCommit(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.undoCommit(path);
  }
}
