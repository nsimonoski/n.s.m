import { FileResponseDto } from './file.contract';
import { FileType } from './enums/file-type.enum';

export interface DirectoryResponseDto {
  type: FileType.DIRECTORY;
  id: string;
  name: string;
  path: string;
  files: FileResponseDto[];
  directories: DirectoryResponseDto[];
  updatedAt: string;
}

export interface DirectoryCreateRequestDto {
  name: string;
  path: string;
}