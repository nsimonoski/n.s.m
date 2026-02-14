import { FileType } from '@org/shared/contracts';

const extensionMap: Record<string, FileType> = {
  ts: FileType.TS,
  js: FileType.JS,
  html: FileType.HTML,
  css: FileType.CSS,
  scss: FileType.SCSS,
  json: FileType.JSON,
  md: FileType.MD,
  txt: FileType.TXT,
  png: FileType.PNG,
  jpg: FileType.JPG,
  jpeg: FileType.JPG,
  svg: FileType.SVG,
  pdf: FileType.PDF,
};

export const getFileTypeFromExtension = (ext?: string): FileType =>
  ext ? (extensionMap[ext.toLowerCase()] ?? FileType.OTHER) : FileType.OTHER;
