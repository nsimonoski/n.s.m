import { Enums } from '@org/shared/contracts';

export interface FileIconConfig {
  iconClass: string;
  color: string;
}

const FILE_ICON_MAP: Record<Enums.FileType, FileIconConfig> = {
  [Enums.FileType.DIRECTORY]: {
    iconClass: 'codicon-folder',
    color: '#dcb67a',
  },
  [Enums.FileType.TS]: {
    iconClass: 'codicon-symbol-method',
    color: '#3178c6',
  },
  [Enums.FileType.JS]: {
    iconClass: 'codicon-symbol-method',
    color: '#f1dd3f',
  },
  [Enums.FileType.HTML]: {
    iconClass: 'codicon-code',
    color: '#e34c26',
  },
  [Enums.FileType.CSS]: {
    iconClass: 'codicon-symbol-color',
    color: '#563d7c',
  },
  [Enums.FileType.SCSS]: {
    iconClass: 'codicon-symbol-color',
    color: '#563d7c',
  },
  [Enums.FileType.JSON]: {
    iconClass: 'codicon-json',
    color: '#89e051',
  },
  [Enums.FileType.MD]: {
    iconClass: 'codicon-markdown',
    color: '#519aba',
  },
  [Enums.FileType.TXT]: {
    iconClass: 'codicon-file',
    color: '#c5c5c5',
  },
  [Enums.FileType.PNG]: {
    iconClass: 'codicon-file-media',
    color: '#a074c4',
  },
  [Enums.FileType.JPG]: {
    iconClass: 'codicon-file-media',
    color: '#a074c4',
  },
  [Enums.FileType.SVG]: {
    iconClass: 'codicon-symbol-color',
    color: '#ffb13b',
  },
  [Enums.FileType.PDF]: {
    iconClass: 'codicon-file-pdf',
    color: '#e53935',
  },
  [Enums.FileType.OTHER]: {
    iconClass: 'codicon-file',
    color: '#c5c5c5',
  },
};

export const getFileIcon = (fileType: Enums.FileType, isExpanded?: boolean): FileIconConfig => {
  if (fileType === Enums.FileType.DIRECTORY) {
    return {
      iconClass: isExpanded ? 'codicon-folder-opened' : 'codicon-folder',
      color: '#dcb67a',
    };
  }

  return FILE_ICON_MAP[fileType] || FILE_ICON_MAP[Enums.FileType.OTHER];
};

export const getExpandIcon = (isExpanded: boolean): string => {
  return isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right';
};
