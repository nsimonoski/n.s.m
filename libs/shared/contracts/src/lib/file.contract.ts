import { FileType } from './enums/file-type.enum';

export interface FileResponseDto {
  id: string;
  name: string;
  path: string;
  content?: string;
  updatedAt: string;
  createdAt?: string;
  type: FileType;
  extension?: string;
  gitIgnored?: boolean;
}

export interface FileUpdateRequestDto {
  id: string;
  content: string;
}

export interface FileCreateRequestDto {
  name: string;
  path: string;
  content?: string;
}

export interface RenameRequestDto {
  path: string;
  newName: string;
}

export interface FileIconConfig {
  iconClass: string;
  color: string;
}
