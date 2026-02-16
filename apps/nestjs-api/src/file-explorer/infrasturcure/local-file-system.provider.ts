import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import * as path from 'path';

import type { FileResponseDto, DirectoryResponseDto } from '@org/shared/contracts';
import { Enums } from '@org/shared/contracts';
import { FileSystemErrorMapper } from '../domain/file-system-error.mapper';
import { FileSystemProvider } from '../domain/file-system.provider';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FileUtils } from '@org/shared/utils';

const execFileAsync = promisify(execFile);

@Injectable()
export class LocalFileSystemProvider extends FileSystemProvider {
  constructor(private readonly errorMapper: FileSystemErrorMapper) {
    super();
  }

  async readDirectory(dirPath: string): Promise<DirectoryResponseDto> {
    const stat = await fs.stat(dirPath);
    const node = this.toDirectoryDto(dirPath, stat);

    if (!stat.isDirectory()) {
      return node;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const fullPaths = entries.map((e) => path.join(dirPath, e.name));
    const ignoredPaths = await this.getGitIgnoredPaths(dirPath, fullPaths);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const entryStat = await fs.stat(fullPath);
      const gitIgnored = ignoredPaths.has(fullPath);

      if (entry.isFile()) {
        node.files.push(this.toFileDto(fullPath, entryStat, { gitIgnored }));
      } else if (entry.isDirectory()) {
        node.directories.push(this.toDirectoryDto(fullPath, entryStat, { gitIgnored }));
      }
    }

    return node;
  }

  async getFile(filePath: string): Promise<FileResponseDto | undefined> {
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        return undefined;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      return this.toFileDto(filePath, stat, { content });
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async updateFile(fileDto: FileResponseDto): Promise<FileResponseDto> {
    try {
      const stat = await fs.stat(fileDto.path);

      if (!stat.isFile()) {
        throw new BadRequestException(`File not found: ${fileDto.path}`);
      }

      await fs.writeFile(fileDto.path, fileDto.content ?? '');

      const updatedStat = await fs.stat(fileDto.path);
      return this.toFileDto(fileDto.path, updatedStat, { content: fileDto.content });
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async rename(nodePath: string, newName: string): Promise<{ path: string }> {
    try {
      await fs.stat(nodePath);

      const newPath = path.join(path.dirname(nodePath), newName);
      await fs.rename(nodePath, newPath);

      return { path: newPath };
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async delete(path: string): Promise<{ path: string }> {
    try {
      await fs.rm(path, { recursive: true, force: false });
      return { path };
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async createDirectory(dirPath: string): Promise<DirectoryResponseDto> {
    try {
      await fs.mkdir(dirPath);

      const stat = await fs.stat(dirPath);
      return this.toDirectoryDto(dirPath, stat);
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async createFile(filePath: string, content = ''): Promise<FileResponseDto> {
    try {
      await fs.writeFile(filePath, content);

      const stat = await fs.stat(filePath);
      return this.toFileDto(filePath, stat, { content });
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  private toFileDto(
    filePath: string,
    stat: { mtime: Date },
    overrides?: Partial<FileResponseDto>,
  ): FileResponseDto {
    const ext = path.extname(filePath).slice(1);
    return {
      id: filePath,
      name: path.basename(filePath),
      path: filePath,
      updatedAt: stat.mtime.toISOString(),
      extension: ext || undefined,
      type: FileUtils.getFileTypeFromExtension(ext),
      ...overrides,
    };
  }

  private toDirectoryDto(
    dirPath: string,
    stat: { mtime: Date },
    overrides?: Partial<DirectoryResponseDto>,
  ): DirectoryResponseDto {
    return {
      type: Enums.FileType.DIRECTORY,
      id: dirPath,
      name: path.basename(dirPath),
      path: dirPath,
      files: [],
      directories: [],
      updatedAt: stat.mtime.toISOString(),
      ...overrides,
    };
  }

  private async getGitIgnoredPaths(dirPath: string, paths: string[]): Promise<Set<string>> {
    if (paths.length === 0) {
      return new Set();
    }

    try {
      const { stdout } = await execFileAsync('git', ['check-ignore', ...paths], { cwd: dirPath });
      return new Set(stdout.trim().split('\n').filter(Boolean));
    } catch {
      return new Set();
    }
  }
}
