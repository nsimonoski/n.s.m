import type { DirectoryResponseDto } from '@org/shared/contracts';

export function getAncestorPaths(rootPath: string, filePath: string): string[] {
  const paths: string[] = [];
  let current = filePath.substring(0, filePath.lastIndexOf('/'));

  while (current.length >= rootPath.length) {
    paths.unshift(current);
    current = current.substring(0, current.lastIndexOf('/'));
  }

  return paths;
}

export function isDirectoryLoaded(root: DirectoryResponseDto, targetPath: string): boolean {
  const node = findDirectory(root, targetPath);
  return !!node && (node.files.length > 0 || node.directories.length > 0);
}

export function findDirectory(
  root: DirectoryResponseDto,
  targetPath: string,
): DirectoryResponseDto | null {
  if (root.path === targetPath) return root;

  for (const dir of root.directories) {
    const found = findDirectory(dir, targetPath);
    if (found) return found;
  }

  return null;
}

export function mergeDirectoryIntoTree(
  root: DirectoryResponseDto,
  targetPath: string,
  fetched: DirectoryResponseDto,
): DirectoryResponseDto {
  if (root.path === targetPath) {
    return { ...root, files: fetched.files, directories: fetched.directories };
  }

  return {
    ...root,
    directories: root.directories.map((dir) => mergeDirectoryIntoTree(dir, targetPath, fetched)),
  };
}

export function refreshDirectoryInTree(
  root: DirectoryResponseDto,
  parentPath: string,
  fetched: DirectoryResponseDto,
): DirectoryResponseDto {
  if (root.path === parentPath) {
    return fetched;
  }

  return {
    ...root,
    directories: root.directories.map((dir) => refreshDirectoryInTree(dir, parentPath, fetched)),
  };
}
