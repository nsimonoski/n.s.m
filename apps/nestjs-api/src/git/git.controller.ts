import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type {
  GitCheckoutRequestDto,
  GitCloneRequestDto,
  GitCommitRequestDto,
  GitLogEntryDto,
  GitPullRequestDto,
  GitPushRequestDto,
  GitStageRequestDto,
  GitStatusDto,
  GitStatusTreeResponseDto,
} from '@org/shared/contracts';
import { GitTreeUtils } from '@org/shared/utils';
import { GitProvider } from './domain/git.provider';

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
  async statusTree(
    @Query('path') path: string,
  ): Promise<GitStatusTreeResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    const status = await this.service.status(path);
    return {
      tree: GitTreeUtils.buildGitChangesTree(status),
      statusMap: GitTreeUtils.buildGitStatusMap(status),
      ahead: status.ahead,
      behind: status.behind,
    };
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

  @Post('clone')
  async clone(@Body() body: GitCloneRequestDto): Promise<void> {
    if (!body.url || !body.path) {
      throw new BadRequestException('URL and path are required');
    }

    return this.service.clone(body.url, body.path);
  }

  @Post('checkout')
  async checkout(
    @Query('path') path: string,
    @Body() body: GitCheckoutRequestDto,
  ): Promise<void> {
    if (!path || !body.branch) {
      throw new BadRequestException('Path and branch are required');
    }

    return this.service.checkout(path, body.branch);
  }

  @Post('fetch')
  async fetch(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.fetch(path);
  }

  @Post('pull')
  async pull(
    @Query('path') path: string,
    @Body() body: GitPullRequestDto,
  ): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.pull(path, body.remote, body.branch);
  }

  @Post('push')
  async push(
    @Query('path') path: string,
    @Body() body: GitPushRequestDto,
  ): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.push(path, body.remote, body.branch);
  }

  @Post('commit')
  async commit(
    @Query('path') path: string,
    @Body() body: GitCommitRequestDto,
  ): Promise<GitLogEntryDto> {
    if (!path || !body.message) {
      throw new BadRequestException('Path and message are required');
    }

    return this.service.commit(path, body.message);
  }

  @Post('stage')
  async stage(
    @Query('path') path: string,
    @Body() body: GitStageRequestDto,
  ): Promise<void> {
    if (!path || !body.paths?.length) {
      throw new BadRequestException('Path and file paths are required');
    }

    return this.service.stage(path, body.paths);
  }

  @Post('unstage')
  async unstage(
    @Query('path') path: string,
    @Body() body: GitStageRequestDto,
  ): Promise<void> {
    if (!path || !body.paths?.length) {
      throw new BadRequestException('Path and file paths are required');
    }

    return this.service.unstage(path, body.paths);
  }

  @Post('undo-commit')
  async undoCommit(@Query('path') path: string): Promise<void> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.undoCommit(path);
  }
}
