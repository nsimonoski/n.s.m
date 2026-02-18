import {
  DirectoryResponseDto,
  FileResponseDto,
  GitFileStatus,
  GitStatusDto,
  Enums,
} from '@org/shared/contracts';
import { getFileTypeFromExtension } from '../file-utils/file-type.utils';

interface TreeNode {
  dirs: Map<string, TreeNode>;
  files: FileResponseDto[];
  name: string;
}

function createTreeNode(name: string): TreeNode {
  return { dirs: new Map(), files: [], name };
}

function insertIntoTree(root: TreeNode, filePath: string): void {
  const segments = filePath.split('/');
  const fileName = segments.pop();
  if (!fileName) return;
  let current = root;

  for (const segment of segments) {
    if (!current.dirs.has(segment)) {
      current.dirs.set(segment, createTreeNode(segment));
    }
    current = current.dirs.get(segment) ?? current;
  }

  const ext = fileName.includes('.') ? fileName.split('.').pop() : undefined;
  current.files.push({
    id: filePath,
    name: fileName,
    path: filePath,
    updatedAt: new Date().toISOString(),
    type: getFileTypeFromExtension(ext),
    extension: ext,
  });
}

function treeNodeToDirectory(node: TreeNode, path: string): DirectoryResponseDto {
  const directories: DirectoryResponseDto[] = [];
  for (const [dirName, child] of node.dirs) {
    directories.push(treeNodeToDirectory(child, `${path}/${dirName}`));
  }

  return {
    type: Enums.FileType.DIRECTORY,
    id: path,
    name: node.name,
    path,
    files: node.files,
    directories,
    updatedAt: new Date().toISOString(),
  };
}

function buildSectionTree(sectionName: string, filePaths: string[]): DirectoryResponseDto {
  const root = createTreeNode(`${sectionName} (${filePaths.length})`);

  for (const filePath of filePaths) {
    insertIntoTree(root, filePath);
  }

  return treeNodeToDirectory(root, `/${sectionName.toLowerCase()}`);
}

export function compactDirectory(dir: DirectoryResponseDto): DirectoryResponseDto {
  const compactedChildren = dir.directories.map((child) => compactDirectory(child));

  if (compactedChildren.length === 1 && dir.files.length === 0) {
    const child = compactedChildren[0];
    return {
      ...child,
      name: `${dir.name}/${child.name}`,
      id: child.id,
      path: child.path,
    };
  }

  return { ...dir, directories: compactedChildren };
}

export function buildGitChangesTree(status: GitStatusDto): DirectoryResponseDto {
  const directories: DirectoryResponseDto[] = [];

  if (status.staged.length > 0) {
    const section = buildSectionTree(
      'Staged',
      status.staged.map((f) => f.path),
    );
    directories.push({
      ...section,
      directories: section.directories.map(compactDirectory),
    });
  }

  const changesPaths = [...status.unstaged.map((f) => f.path), ...status.untracked];
  if (changesPaths.length > 0) {
    const section = buildSectionTree('Changes', changesPaths);
    directories.push({
      ...section,
      directories: section.directories.map(compactDirectory),
    });
  }

  return {
    type: Enums.FileType.DIRECTORY,
    id: 'git-root',
    name: 'Source Control',
    path: '',
    files: [],
    directories,
    updatedAt: new Date().toISOString(),
  };
}

const STATUS_LETTER: Record<string, string> = {
  [GitFileStatus.MODIFIED]: 'M',
  [GitFileStatus.ADDED]: 'A',
  [GitFileStatus.DELETED]: 'D',
  [GitFileStatus.RENAMED]: 'R',
  [GitFileStatus.COPIED]: 'C',
  [GitFileStatus.UNTRACKED]: 'U',
};

export function buildGitStatusMap(status: GitStatusDto): Record<string, string> {
  const map: Record<string, string> = {};

  for (const file of status.staged) {
    map[file.path] = STATUS_LETTER[file.status] ?? '?';
  }

  for (const file of status.unstaged) {
    map[file.path] = STATUS_LETTER[file.status] ?? '?';
  }

  for (const path of status.untracked) {
    map[path] = 'U';
  }

  return map;
}
