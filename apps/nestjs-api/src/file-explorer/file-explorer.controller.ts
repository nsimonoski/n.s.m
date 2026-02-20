import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Put,
  Delete,
  BadRequestException,
} from '@nestjs/common';

import type {
  FileResponseDto,
  DirectoryResponseDto,
  RenameRequestDto,
} from '@org/shared/contracts';

import { FileSystemProvider } from './domain/file-system.provider';

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
      decodeURIComponent(searchPath),
      decodeURIComponent(query),
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('files')
  async getFiles(@Body('paths') paths: string[]): Promise<FileResponseDto[]> {
    if (!paths || paths.length === 0) {
      throw new BadRequestException('Paths array is required');
    }

    return this.service.getFiles(paths.map(decodeURIComponent));
  }

  @Get('file')
  async getFile(@Query('path') id: string): Promise<FileResponseDto> {
    const file = await this.service.getFile(decodeURIComponent(id));

    if (!file) {
      throw new BadRequestException(`File not found: ${id}`);
    }

    return file;
  }

  @Put('file')
  async updateFile(@Body() fileDto: FileResponseDto): Promise<FileResponseDto> {
    return this.service.updateFile(fileDto);
  }

  @Put('rename')
  async rename(@Body() body: RenameRequestDto): Promise<{ path: string }> {
    const { path, newName } = body;

    if (!path || !newName) {
      throw new BadRequestException('Path and new name are required');
    }

    return this.service.rename(path, newName);
  }

  @Post('file')
  async createFile(
    @Body('path') path: string,
    @Body('content') content?: string,
  ): Promise<FileResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.createFile(path, content);
  }

  @Post('directory')
  async createDirectory(@Body('path') path: string): Promise<DirectoryResponseDto> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.createDirectory(path);
  }

  @Delete()
  async delete(@Body('path') path: string): Promise<{ path: string }> {
    if (!path) {
      throw new BadRequestException('Path is required');
    }

    return this.service.delete(path);
  }
}
