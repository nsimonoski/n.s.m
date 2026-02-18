import { Enums } from '@org/shared/contracts';

const extensionMap: Record<string, Enums.FileType> = {
  ts: Enums.FileType.TS,
  js: Enums.FileType.JS,
  html: Enums.FileType.HTML,
  css: Enums.FileType.CSS,
  scss: Enums.FileType.SCSS,
  json: Enums.FileType.JSON,
  md: Enums.FileType.MD,
  txt: Enums.FileType.TXT,
  png: Enums.FileType.PNG,
  jpg: Enums.FileType.JPG,
  jpeg: Enums.FileType.JPG,
  svg: Enums.FileType.SVG,
  pdf: Enums.FileType.PDF,
};

export const getFileTypeFromExtension = (ext?: string): Enums.FileType =>
  ext ? (extensionMap[ext.toLowerCase()] ?? Enums.FileType.OTHER) : Enums.FileType.OTHER;
