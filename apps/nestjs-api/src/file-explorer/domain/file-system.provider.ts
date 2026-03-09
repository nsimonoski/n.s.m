import type { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';

export abstract class FileSystemProvider {
  abstract readDirectory(path: string): Promise<DirectoryResponseDto>;

  abstract getFile(path: string): Promise<FileResponseDto | undefined>;

  abstract getFiles(paths: string[]): Promise<FileResponseDto[]>;

  abstract rename(nodePath: string, newName: string): Promise<{ path: string }>;

  abstract updateFile(fileDto: FileResponseDto): Promise<FileResponseDto>;

  abstract delete(path: string): Promise<{ path: string }>;

  abstract createDirectory(path: string): Promise<DirectoryResponseDto>;

  abstract createFile(path: string, content?: string): Promise<FileResponseDto>;

  abstract searchFiles(rootPath: string, query: string, limit?: number): Promise<FileResponseDto[]>;
}
