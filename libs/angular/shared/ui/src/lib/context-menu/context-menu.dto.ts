import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';

export interface ContextMenuEvent {
  mouseEvent: MouseEvent;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export interface ContextMenuActionEvent {
  action: ContextMenuAction;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export interface ContextMenuTemplateContext {
  $implicit: ContextMenuState;
  close: () => void;
}

export interface ResizeState {
  isResizing: boolean;
  startX: number;
  startWidth: number;
}

export interface InlineCreateEvent {
  parentPath: string;
  name: string;
  type: 'file' | 'directory';
}

export interface InlineRenameEvent {
  node: DirectoryResponseDto | FileResponseDto;
  newName: string;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: ContextMenuAction | '';
  disabled?: boolean;
  separator?: boolean;
}

export enum ContextMenuAction {
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

export enum ContextMenuIcon {
  FILE = '📄',
  FOLDER = '📁',
  OPEN = '📂',
  RENAME = '✏️',
  DELETE = '🗑️',
  STAGE = '➕',
  UNSTAGE = '➖',
  DISCARD = '↩️',
}

export const CONTEXT_MENU_ITEMS = {
  NEW_FILE: {
    label: 'New File',
    icon: ContextMenuIcon.FILE,
    action: ContextMenuAction.NEW_FILE,
  } as ContextMenuItem,

  NEW_FOLDER: {
    label: 'New Folder',
    icon: ContextMenuIcon.FOLDER,
    action: ContextMenuAction.NEW_FOLDER,
  } as ContextMenuItem,

  OPEN: {
    label: 'Open',
    icon: ContextMenuIcon.OPEN,
    action: ContextMenuAction.OPEN,
  } as ContextMenuItem,

  RENAME: {
    label: 'Rename',
    icon: ContextMenuIcon.RENAME,
    action: ContextMenuAction.RENAME,
  } as ContextMenuItem,

  DELETE: {
    label: 'Delete',
    icon: ContextMenuIcon.DELETE,
    action: ContextMenuAction.DELETE,
  } as ContextMenuItem,

  SEPARATOR: {
    separator: true,
    label: '',
    action: '',
  } as ContextMenuItem,
};

export const GIT_CONTEXT_MENU_ITEMS = {
  STAGE: {
    label: 'Stage',
    icon: ContextMenuIcon.STAGE,
    action: ContextMenuAction.STAGE,
  } as ContextMenuItem,

  UNSTAGE: {
    label: 'Unstage',
    icon: ContextMenuIcon.UNSTAGE,
    action: ContextMenuAction.UNSTAGE,
  } as ContextMenuItem,

  DISCARD: {
    label: 'Discard Changes',
    icon: ContextMenuIcon.DISCARD,
    action: ContextMenuAction.DISCARD,
  } as ContextMenuItem,

  OPEN: {
    label: 'Open File',
    icon: ContextMenuIcon.OPEN,
    action: ContextMenuAction.OPEN,
  } as ContextMenuItem,

  SEPARATOR: CONTEXT_MENU_ITEMS.SEPARATOR,
};

export const TAB_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  { label: 'Close', action: ContextMenuAction.CLOSE },
  { label: 'Close Others', action: ContextMenuAction.CLOSE_OTHERS },
  { label: 'Close to the Right', action: ContextMenuAction.CLOSE_TO_THE_RIGHT },
  CONTEXT_MENU_ITEMS.SEPARATOR,
  { label: 'Close Saved', action: ContextMenuAction.CLOSE_SAVED },
  { label: 'Close All', action: ContextMenuAction.CLOSE_ALL },
];
