export interface ReadDirectoryRequestDto {
  path: string;
}

export interface FileChangeEvent {
  type: 'add' | 'unlink' | 'addDir' | 'unlinkDir' | 'change';
  path: string;
}

export const FILE_CHANGE_EVENT = 'file:change';
export const FILE_WATCH_EVENT = 'file:watch';
