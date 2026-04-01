import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Put,
  Delete,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import type {
  FileResponseDto,
  DirectoryResponseDto,
  RenameRequestDto,
} from '@org/shared/contracts';
import { Permission } from '@org/shared/contracts';

import { PermissionGuard, RateLimitRead, RateLimitWrite } from '../common';
import { AuthGuard } from '../auth/auth.guard';
import { FileSystemProvider } from './domain/file-system.provider';

@RateLimitRead()
@UseGuards(AuthGuard)
@Controller('file-explorer')
export class FileExplorerController {
  constructor(private readonly service: FileSystemProvider) {}

  @Post('read')
  async read(@Body('path') path: string): Promise<DirectoryResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.readDirectory(path);
  }

  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('path') searchPath: string,
    @Query('limit') limit?: string,
  ): Promise<FileResponseDto[]> {
    if (!query || !searchPath) {
      throw new BadRequestException('Query and path are required');
    }

    return this.service.searchFiles(
      searchPath,
      query,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('files')
  async getFiles(@Body('paths') paths: string[]): Promise<FileResponseDto[]> {
    if (!paths || paths.length === 0) {
      throw new BadRequestException('Paths array is required');
    }

    return this.service.getFiles(paths);
  }

  @Get('file')
  async getFile(@Query('path') id: string): Promise<FileResponseDto> {
    const file = await this.service.getFile(id);

    if (!file) {
      throw new BadRequestException(`File not found: ${id}`);
    }

    return file;
  }

  @RateLimitWrite()
  @Put('file')
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async updateFile(@Body() fileDto: FileResponseDto): Promise<FileResponseDto> {
    return this.service.updateFile(fileDto);
  }

  @RateLimitWrite()
  @Put('rename')
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async rename(@Body() body: RenameRequestDto): Promise<{ path: string }> {
    const { path, newName } = body;

    if (!path || !newName) {
      throw new BadRequestException('Path and new name are required');
    }

    return this.service.rename(path, newName);
  }

  @RateLimitWrite()
  @Post('file')
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async createFile(
    @Body('path') path: string,
    @Body('content') content?: string,
  ): Promise<FileResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.createFile(path, content);
  }

  @RateLimitWrite()
  @Post('directory')
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async createDirectory(@Body('path') path: string): Promise<DirectoryResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.createDirectory(path);
  }

  @RateLimitWrite()
  @Delete()
  @UseGuards(PermissionGuard(Permission.FileWrite))
  async delete(@Body('path') path: string): Promise<{ path: string }> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.delete(path);
  }
}
