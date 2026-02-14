import { FileType } from '@org/shared/contracts';

export interface FileIconConfig {
  iconClass: string;
  color: string;
}

const FILE_ICON_MAP: Record<FileType, FileIconConfig> = {
  [FileType.DIRECTORY]: {
    iconClass: 'codicon-folder',
    color: '#dcb67a',
  },
  [FileType.TS]: {
    iconClass: 'codicon-symbol-method',
    color: '#3178c6',
  },
  [FileType.JS]: {
    iconClass: 'codicon-symbol-method',
    color: '#f1dd3f',
  },
  [FileType.HTML]: {
    iconClass: 'codicon-code',
    color: '#e34c26',
  },
  [FileType.CSS]: {
    iconClass: 'codicon-symbol-color',
    color: '#563d7c',
  },
  [FileType.SCSS]: {
    iconClass: 'codicon-symbol-color',
    color: '#563d7c',
  },
  [FileType.JSON]: {
    iconClass: 'codicon-json',
    color: '#89e051',
  },
  [FileType.MD]: {
    iconClass: 'codicon-markdown',
    color: '#519aba',
  },
  [FileType.TXT]: {
    iconClass: 'codicon-file',
    color: '#c5c5c5',
  },
  [FileType.PNG]: {
    iconClass: 'codicon-file-media',
    color: '#a074c4',
  },
  [FileType.JPG]: {
    iconClass: 'codicon-file-media',
    color: '#a074c4',
  },
  [FileType.SVG]: {
    iconClass: 'codicon-symbol-color',
    color: '#ffb13b',
  },
  [FileType.PDF]: {
    iconClass: 'codicon-file-pdf',
    color: '#e53935',
  },
  [FileType.OTHER]: {
    iconClass: 'codicon-file',
    color: '#c5c5c5',
  },
};

export const getFileIcon = (fileType: FileType, isExpanded?: boolean): FileIconConfig => {
  if (fileType === FileType.DIRECTORY) {
    return {
      iconClass: isExpanded ? 'codicon-folder-opened' : 'codicon-folder',
      color: '#dcb67a',
    };
  }

  return FILE_ICON_MAP[fileType] || FILE_ICON_MAP[FileType.OTHER];
};

export const getExpandIcon = (isExpanded: boolean): string => {
  return isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right';
};
