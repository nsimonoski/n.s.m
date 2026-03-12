import { execFile } from 'child_process';
import { promisify } from 'util';

import type { FileResponseDto, DirectoryResponseDto } from '@org/shared/contracts';
import { Enums } from '@org/shared/contracts';
import { FileSystemProvider } from '../domain/file-system.provider';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FileUtils } from '@org/shared/utils';
import { FileSystemService, PathUtils } from '../../common';

const execFileAsync = promisify(execFile);

@Injectable()
export class LocalFileSystemProvider extends FileSystemProvider {
  constructor(private readonly fileSystemService: FileSystemService) {
    super();
  }

  async readDirectory(dirPath: string): Promise<DirectoryResponseDto> {
    const { mtime, isDirectory } = await this.fileSystemService.getFileMetadata(dirPath);
    const node = this.toDirectoryDto(dirPath, mtime);

    if (!isDirectory) {
      return node;
    }

    const allEntries = await this.fileSystemService.listDirectoryWithTypes(dirPath);
    const entries = allEntries.filter((e) => e.name !== '.git');
    const fullPaths = entries.map((e) => PathUtils.combine(dirPath, e.name));
    const ignoredPaths = await this.getGitIgnoredPaths(dirPath, fullPaths);

    for (const entry of entries) {
      const fullPath = PathUtils.combine(dirPath, entry.name);
      const { mtime } = await this.fileSystemService.getFileMetadata(fullPath);
      const gitIgnored = ignoredPaths.has(fullPath);

      if (entry.isFile()) {
        node.files.push(this.toFileDto(fullPath, mtime, { gitIgnored }));
      } else if (entry.isDirectory()) {
        node.directories.push(this.toDirectoryDto(fullPath, mtime, { gitIgnored }));
      }
    }

    return node;
  }

  async getFile(filePath: string): Promise<FileResponseDto | undefined> {
    try {
      const { mtime, isFile } = await this.fileSystemService.getFileMetadata(filePath);
      if (!isFile) {
        return undefined;
      }

      const content = await this.fileSystemService.readFileContent(filePath);
      return this.toFileDto(filePath, mtime, { content });
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  async getFiles(paths: string[]): Promise<FileResponseDto[]> {
    const results: FileResponseDto[] = [];
    for (const filePath of paths) {
      const file = await this.getFile(filePath);
      if (file) {
        results.push(file);
      }
    }
    return results;
  }

  async updateFile(fileDto: FileResponseDto): Promise<FileResponseDto> {
    try {
      const { isFile } = await this.fileSystemService.getFileMetadata(fileDto.path);

      if (!isFile) {
        throw new BadRequestException(`File not found: ${fileDto.path}`);
      }

      const content = await this.formatWithPrettier(fileDto.path, fileDto.content ?? '');
      await this.fileSystemService.writeFileContent(fileDto.path, content);

      const { mtime } = await this.fileSystemService.getFileMetadata(fileDto.path);
      return this.toFileDto(fileDto.path, mtime, { content });
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  async rename(nodePath: string, newName: string): Promise<{ path: string }> {
    try {
      await this.fileSystemService.getFileMetadata(nodePath);

      const newPath = PathUtils.combine(PathUtils.getParentDirectory(nodePath), newName);
      await this.fileSystemService.move(nodePath, newPath);

      return { path: newPath };
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  async delete(nodePath: string): Promise<{ path: string }> {
    try {
      await this.fileSystemService.remove(nodePath);
      return { path: nodePath };
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  async createDirectory(dirPath: string): Promise<DirectoryResponseDto> {
    try {
      await this.fileSystemService.createDirectory(dirPath);

      const { mtime } = await this.fileSystemService.getFileMetadata(dirPath);
      return this.toDirectoryDto(dirPath, mtime);
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  async searchFiles(rootPath: string, query: string, limit = 20): Promise<FileResponseDto[]> {
    return this.searchDirectoryRecursive(rootPath, query.toLowerCase(), limit);
  }

  async createFile(filePath: string, content = ''): Promise<FileResponseDto> {
    try {
      await this.fileSystemService.writeFileContent(filePath, content);

      const { mtime } = await this.fileSystemService.getFileMetadata(filePath);
      return this.toFileDto(filePath, mtime, { content });
    } catch (error) {
      throw this.fileSystemService.mapToHttpException(error);
    }
  }

  private toFileDto(
    filePath: string,
    mtime: Date,
    overrides?: Partial<FileResponseDto>,
  ): FileResponseDto {
    const ext = PathUtils.getExtension(filePath);
    return {
      id: filePath,
      name: PathUtils.getFileName(filePath),
      path: filePath,
      updatedAt: mtime.toISOString(),
      extension: ext || undefined,
      type: FileUtils.getFileTypeFromExtension(ext),
      ...overrides,
    };
  }

  private toDirectoryDto(
    dirPath: string,
    mtime: Date,
    overrides?: Partial<DirectoryResponseDto>,
  ): DirectoryResponseDto {
    return {
      type: Enums.FileType.DIRECTORY,
      id: dirPath,
      name: PathUtils.getFileName(dirPath),
      path: dirPath,
      files: [],
      directories: [],
      updatedAt: mtime.toISOString(),
      ...overrides,
    };
  }

  private async searchDirectoryRecursive(
    dirPath: string,
    query: string,
    limit: number,
    results: FileResponseDto[] = [],
  ): Promise<FileResponseDto[]> {
    if (results.length >= limit) return results;

    const skipDirs = new Set(['.git', 'node_modules', 'dist', '.nx', '.angular']);

    let entries: string[];
    try {
      entries = await this.fileSystemService.listDirectory(dirPath);
    } catch {
      return results;
    }

    const fullPaths = entries.map((name) => PathUtils.combine(dirPath, name));
    const ignoredPaths = await this.getGitIgnoredPaths(dirPath, fullPaths);

    for (const name of entries) {
      if (results.length >= limit) return results;

      const fullPath = PathUtils.combine(dirPath, name);
      if (ignoredPaths.has(fullPath)) continue;

      const { mtime, isFile, isDirectory } = await this.fileSystemService.getFileMetadata(fullPath);

      if (isFile) {
        if (name.toLowerCase().includes(query)) {
          results.push(this.toFileDto(fullPath, mtime));
        }
      } else if (isDirectory && !skipDirs.has(name)) {
        await this.searchDirectoryRecursive(fullPath, query, limit, results);
      }
    }

    return results;
  }

  private async formatWithPrettier(filePath: string, content: string): Promise<string> {
    try {
      const prettier = await import('prettier');
      const fileInfo = await prettier.getFileInfo(filePath);
      if (fileInfo.ignored || !fileInfo.inferredParser) return content;

      const config = await prettier.resolveConfig(filePath);
      return await prettier.format(content, { ...config, filepath: filePath });
    } catch {
      return content;
    }
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
