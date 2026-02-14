import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';

export abstract class FileSystemProvider {
  abstract readDirectory(path: string): Promise<DirectoryResponseDto>;

  abstract getFile(path: string): Promise<FileResponseDto | undefined>;

  abstract rename(fileDto: FileResponseDto, newName: string): Promise<FileResponseDto>;
  
  abstract updateFile(fileDto: FileResponseDto): Promise<FileResponseDto>;

  abstract delete(path: string): Promise<{ path: string }>;

  abstract createDirectory(path: string): Promise<DirectoryResponseDto>;

  abstract createFile(path: string, content?: string): Promise<FileResponseDto>;
}
