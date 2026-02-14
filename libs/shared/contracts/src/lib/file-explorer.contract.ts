export interface FileResponseDto {
  name: string;
  path: string;
  isFile: boolean;
  updatedAt: string;
}

export interface DirectoryResponseDto {
  name: string;
  path: string;
  isFile: boolean;
  updatedAt: string;
  children?: DirectoryResponseDto[];
}

export interface ReadDirectoryRequestDto {
  path: string;
}
