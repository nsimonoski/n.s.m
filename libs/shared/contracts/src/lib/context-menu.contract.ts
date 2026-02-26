import { DirectoryResponseDto } from './directory.contract';
import { FileResponseDto } from './file.contract';

export interface InlineCreateEvent {
  parentPath: string;
  name: string;
  type: 'file' | 'directory';
}

export interface InlineRenameEvent {
  node: DirectoryResponseDto | FileResponseDto;
  newName: string;
}

export interface Item {
  label: string;
  icon?: string;
  action: Action | '';
  disabled?: boolean;
  separator?: boolean;
}

export enum Action {
  NEW_FILE = 'new-file',
  NEW_FOLDER = 'new-folder',
  OPEN = 'open',
  RENAME = 'rename',
  DELETE = 'delete',
  STAGE = 'stage',
  UNSTAGE = 'unstage',
  DISCARD = 'discard',
  CLOSE = 'close',
  CLOSE_OTHERS = 'close-others',
  CLOSE_TO_THE_RIGHT = 'close-to-the-right',
  CLOSE_SAVED = 'close-saved',
  STASH = 'stash',
  CLOSE_ALL = 'close-all',
}

export enum Icon {
  FILE = '📄',
  FOLDER = '📁',
  OPEN = '📂',
  RENAME = '✏️',
  DELETE = '🗑️',
  STAGE = '➕',
  UNSTAGE = '➖',
  DISCARD = '↩️',
}

export const ITEMS = {
  NEW_FILE: {
    label: 'New File',
    icon: Icon.FILE,
    action: Action.NEW_FILE,
  } as Item,

  NEW_FOLDER: {
    label: 'New Folder',
    icon: Icon.FOLDER,
    action: Action.NEW_FOLDER,
  } as Item,

  OPEN: {
    label: 'Open',
    icon: Icon.OPEN,
    action: Action.OPEN,
  } as Item,

  RENAME: {
    label: 'Rename',
    icon: Icon.RENAME,
    action: Action.RENAME,
  } as Item,

  DELETE: {
    label: 'Delete',
    icon: Icon.DELETE,
    action: Action.DELETE,
  } as Item,

  SEPARATOR: {
    separator: true,
    label: '',
    action: '',
  } as Item,
};

export const GIT_ITEMS = {
  STAGE: {
    label: 'Stage',
    icon: Icon.STAGE,
    action: Action.STAGE,
  } as Item,

  UNSTAGE: {
    label: 'Unstage',
    icon: Icon.UNSTAGE,
    action: Action.UNSTAGE,
  } as Item,

  DISCARD: {
    label: 'Discard Changes',
    icon: Icon.DISCARD,
    action: Action.DISCARD,
  } as Item,

  OPEN: {
    label: 'Open File',
    icon: Icon.OPEN,
    action: Action.OPEN,
  } as Item,

  SEPARATOR: ITEMS.SEPARATOR,
};

export const TAB_ITEMS: Item[] = [
  { label: 'Close', action: Action.CLOSE },
  { label: 'Close Others', action: Action.CLOSE_OTHERS },
  { label: 'Close to the Right', action: Action.CLOSE_TO_THE_RIGHT },
  ITEMS.SEPARATOR,
  { label: 'Close Saved', action: Action.CLOSE_SAVED },
  { label: 'Close All', action: Action.CLOSE_ALL },
];
