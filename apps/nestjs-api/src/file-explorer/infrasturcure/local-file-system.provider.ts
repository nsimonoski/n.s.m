import { FileSystemProvider } from '../domain/file-system.provider';
import { promises as fs } from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { FileResponseDto, DirectoryResponseDto, FileType } from '@org/shared/contracts';
import { getFileTypeFromExtension } from '@org/shared/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FileSystemErrorMapper } from '../domain/file-system-error.mapper';

const execFileAsync = promisify(execFile);

@Injectable()
export class LocalFileSystemProvider extends FileSystemProvider {
  constructor(private readonly errorMapper: FileSystemErrorMapper) {
    super();
  }

  async readDirectory(dirPath: string): Promise<DirectoryResponseDto> {
    const stat = await fs.stat(dirPath);
    const node: DirectoryResponseDto = {
      type: FileType.DIRECTORY,
      id: dirPath,
      name: path.basename(dirPath),
      path: dirPath,
      files: [],
      directories: [],
      updatedAt: stat.mtime.toISOString(),
    };

    if (stat.isDirectory()) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const fullPaths = entries.map((e) => path.join(dirPath, e.name));
      const ignoredPaths = await this.getGitIgnoredPaths(dirPath, fullPaths);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const entryStat = await fs.stat(fullPath);
        const gitIgnored = ignoredPaths.has(fullPath);

        if (entry.isFile()) {
          const ext = path.extname(entry.name).slice(1);
          node.files.push({
            id: fullPath,
            name: entry.name,
            path: fullPath,
            updatedAt: entryStat.mtime.toISOString(),
            extension: ext || undefined,
            type: getFileTypeFromExtension(ext),
            gitIgnored,
          });
        } else if (entry.isDirectory()) {
          node.directories.push({
            type: FileType.DIRECTORY,
            id: fullPath,
            name: entry.name,
            path: fullPath,
            files: [],
            directories: [],
            updatedAt: entryStat.mtime.toISOString(),
            gitIgnored,
          });
        }
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
      const ext = path.extname(filePath).slice(1);

      return {
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        updatedAt: stat.mtime.toISOString(),
        extension: ext || undefined,
        content,
        type: getFileTypeFromExtension(ext),
      };
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
      const ext = path.extname(fileDto.path).slice(1);

      return {
        ...fileDto,
        extension: ext || undefined,
        type: getFileTypeFromExtension(ext),
        updatedAt: updatedStat.mtime.toISOString(),
      };
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async rename(fileDto: FileResponseDto, newName: string): Promise<FileResponseDto> {
    try {
      const stat = await fs.stat(fileDto.path);
      if (!stat.isFile()) {
        throw new BadRequestException(`File not found: ${fileDto.path}`);
      }

      const oldPath = fileDto.path;
      const newPath = path.join(path.dirname(oldPath), newName);

      await fs.rename(oldPath, newPath);

      const newExt = path.extname(newName).slice(1);
      const newFileType = getFileTypeFromExtension(newExt);

      return {
        ...fileDto,
        name: newName,
        path: newPath,
        extension: newExt || undefined,
        type: newFileType, // Changed from fileType to type
        updatedAt: (await fs.stat(newPath)).mtime.toISOString(),
      };
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

      return {
        type: FileType.DIRECTORY, // Added
        id: dirPath,
        name: path.basename(dirPath),
        path: dirPath,
        files: [],
        directories: [],
        updatedAt: stat.mtime.toISOString(),
      };
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
    }
  }

  async createFile(filePath: string, content = ''): Promise<FileResponseDto> {
    try {
      await fs.writeFile(filePath, content);

      const stat = await fs.stat(filePath);
      const ext = path.extname(filePath).slice(1);

      return {
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        updatedAt: stat.mtime.toISOString(),
        extension: ext || undefined,
        content,
        type: getFileTypeFromExtension(ext),
      };
    } catch (error) {
      throw this.errorMapper.mapFsError(error);
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
