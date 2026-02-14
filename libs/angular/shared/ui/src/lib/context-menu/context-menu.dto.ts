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
}

export enum ContextMenuIcon {
  FILE = '📄',
  FOLDER = '📁',
  OPEN = '📂',
  RENAME = '✏️',
  DELETE = '🗑️',
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
