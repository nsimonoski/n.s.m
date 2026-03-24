import {
  Injectable,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import type { Dirent } from 'fs';

interface FileMetadata {
  mtime: Date;
  isFile: boolean;
  isDirectory: boolean;
}

@Injectable()
export class FileSystemService {
  async getFileMetadata(path: string): Promise<FileMetadata> {
    const stat = await fs.stat(path);
    return { mtime: stat.mtime, isFile: stat.isFile(), isDirectory: stat.isDirectory() };
  }

  readFileContent(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }

  writeFileContent(path: string, content: string): Promise<void> {
    return fs.writeFile(path, content);
  }

  listDirectory(path: string): Promise<string[]> {
    return fs.readdir(path);
  }

  listDirectoryWithTypes(path: string): Promise<Dirent[]> {
    return fs.readdir(path, { withFileTypes: true });
  }

  createDirectory(path: string, recursive = false): Promise<string | undefined> {
    return fs.mkdir(path, { recursive });
  }

  async changeOwner(path: string, uid: number, gid: number): Promise<void> {
    await fs.chown(path, uid, gid);
    const entries = await fs.readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`;
      if (entry.isDirectory()) {
        await this.changeOwner(fullPath, uid, gid);
      } else {
        await fs.chown(fullPath, uid, gid);
      }
    }
  }

  removeDirectory(path: string): Promise<void> {
    return fs.rm(path, { recursive: true, force: true });
  }

  remove(path: string): Promise<void> {
    return fs.rm(path, { recursive: true, force: false });
  }

  move(oldPath: string, newPath: string): Promise<void> {
    return fs.rename(oldPath, newPath);
  }

  copyDirectory(source: string, destination: string): Promise<void> {
    return fs.cp(source, destination, { recursive: true });
  }

  mapToHttpException(error: unknown): HttpException {
    if (error instanceof Error) {
      switch ((error as NodeJS.ErrnoException).code) {
        case 'ENOENT':
          return new NotFoundException('Path not found');
        case 'EACCES':
          return new ForbiddenException('Permission denied');
        case 'EEXIST':
          return new BadRequestException('Already exists');
        default:
          return new InternalServerErrorException(error.message);
      }
    }

    return new InternalServerErrorException('Unknown error');
  }
}
