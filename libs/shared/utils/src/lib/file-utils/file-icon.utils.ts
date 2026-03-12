import { Enums } from '@org/shared/contracts';

export interface FileIconConfig {
  iconClass: string;
  color: string;
}

const FILE_ICON_MAP: Record<Enums.FileType, FileIconConfig> = {
  [Enums.FileType.DIRECTORY]: {
    iconClass: 'codicon-folder',
    color: 'var(--icon-folder)',
  },
  [Enums.FileType.TS]: {
    iconClass: 'codicon-symbol-method',
    color: 'var(--icon-ts)',
  },
  [Enums.FileType.JS]: {
    iconClass: 'codicon-symbol-method',
    color: 'var(--icon-js)',
  },
  [Enums.FileType.HTML]: {
    iconClass: 'codicon-code',
    color: 'var(--icon-html)',
  },
  [Enums.FileType.CSS]: {
    iconClass: 'codicon-symbol-color',
    color: 'var(--icon-css)',
  },
  [Enums.FileType.SCSS]: {
    iconClass: 'codicon-symbol-color',
    color: 'var(--icon-css)',
  },
  [Enums.FileType.JSON]: {
    iconClass: 'codicon-json',
    color: 'var(--icon-json)',
  },
  [Enums.FileType.MD]: {
    iconClass: 'codicon-markdown',
    color: 'var(--icon-md)',
  },
  [Enums.FileType.TXT]: {
    iconClass: 'codicon-file',
    color: 'var(--icon-txt)',
  },
  [Enums.FileType.PNG]: {
    iconClass: 'codicon-file-media',
    color: 'var(--icon-image)',
  },
  [Enums.FileType.JPG]: {
    iconClass: 'codicon-file-media',
    color: 'var(--icon-image)',
  },
  [Enums.FileType.SVG]: {
    iconClass: 'codicon-symbol-color',
    color: 'var(--icon-svg)',
  },
  [Enums.FileType.PDF]: {
    iconClass: 'codicon-file-pdf',
    color: 'var(--icon-pdf)',
  },
  [Enums.FileType.OTHER]: {
    iconClass: 'codicon-file',
    color: 'var(--icon-txt)',
  },
};

export const getFileIcon = (fileType: Enums.FileType, isExpanded?: boolean): FileIconConfig => {
  if (fileType === Enums.FileType.DIRECTORY) {
    return {
      iconClass: isExpanded ? 'codicon-folder-opened' : 'codicon-folder',
      color: 'var(--icon-folder)',
    };
  }

  return FILE_ICON_MAP[fileType] || FILE_ICON_MAP[Enums.FileType.OTHER];
};

export const getExpandIcon = (isExpanded: boolean): string => {
  return isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right';
};
