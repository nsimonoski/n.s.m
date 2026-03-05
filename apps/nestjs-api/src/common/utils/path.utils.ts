import * as path from 'path';

export const PathUtils = {
  combine: (...segments: string[]): string => path.join(...segments),
  getFileName: (filePath: string): string => path.basename(filePath),
  getParentDirectory: (filePath: string): string => path.dirname(filePath),
  getExtension: (filePath: string): string => path.extname(filePath).slice(1),
  getSegments: (filePath: string): string[] => filePath.split(path.sep),
};
