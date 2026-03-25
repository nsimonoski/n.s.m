import type { DirectoryResponseDto } from '@org/shared/contracts';
import { Enums } from '@org/shared/contracts';
import {
  getAncestorPaths,
  collectDirectoryPaths,
  findDirectory,
  isDirectoryLoaded,
  mergeDirectoryIntoTree,
  refreshDirectoryInTree,
} from './file-tree.utils';

function makeDir(
  path: string,
  name: string,
  overrides?: Partial<DirectoryResponseDto>,
): DirectoryResponseDto {
  return {
    type: Enums.FileType.DIRECTORY,
    id: path,
    name,
    path,
    files: [],
    directories: [],
    updatedAt: '',
    ...overrides,
  };
}

describe('getAncestorPaths', () => {
  it('should return ancestor paths for a nested file', () => {
    expect(getAncestorPaths('/root', '/root/a/b/c/file.ts')).toEqual([
      '/root',
      '/root/a',
      '/root/a/b',
      '/root/a/b/c',
    ]);
  });

  it('should return single ancestor for file directly under root child', () => {
    expect(getAncestorPaths('/root', '/root/a/file.ts')).toEqual(['/root', '/root/a']);
  });

  it('should return root path for file at root level', () => {
    expect(getAncestorPaths('/root', '/root/file.ts')).toEqual(['/root']);
  });
});

describe('collectDirectoryPaths', () => {
  it('should collect all directory paths recursively', () => {
    const tree = makeDir('/root', 'root', {
      directories: [
        makeDir('/root/a', 'a', {
          directories: [makeDir('/root/a/b', 'b')],
        }),
        makeDir('/root/c', 'c'),
      ],
    });
    expect(collectDirectoryPaths(tree)).toEqual(['/root', '/root/a', '/root/a/b', '/root/c']);
  });

  it('should return single path for leaf directory', () => {
    expect(collectDirectoryPaths(makeDir('/leaf', 'leaf'))).toEqual(['/leaf']);
  });
});

describe('findDirectory', () => {
  const tree = makeDir('/root', 'root', {
    directories: [
      makeDir('/root/a', 'a', {
        directories: [makeDir('/root/a/b', 'b')],
      }),
    ],
  });

  it('should find root directory', () => {
    expect(findDirectory(tree, '/root')?.path).toBe('/root');
  });

  it('should find nested directory', () => {
    expect(findDirectory(tree, '/root/a/b')?.path).toBe('/root/a/b');
  });

  it('should return null for non-existent path', () => {
    expect(findDirectory(tree, '/root/x')).toBeNull();
  });
});

describe('isDirectoryLoaded', () => {
  it('should return true when directory has files', () => {
    const tree = makeDir('/root', 'root', {
      files: [
        {
          id: '1',
          name: 'file.ts',
          path: '/root/file.ts',
          updatedAt: '',
          type: Enums.FileType.TS,
        },
      ],
    });
    expect(isDirectoryLoaded(tree, '/root')).toBe(true);
  });

  it('should return true when directory has subdirectories', () => {
    const tree = makeDir('/root', 'root', {
      directories: [makeDir('/root/a', 'a')],
    });
    expect(isDirectoryLoaded(tree, '/root')).toBe(true);
  });

  it('should return false when directory is empty', () => {
    expect(isDirectoryLoaded(makeDir('/root', 'root'), '/root')).toBe(false);
  });

  it('should return false when directory not found', () => {
    expect(isDirectoryLoaded(makeDir('/root', 'root'), '/missing')).toBe(false);
  });
});

describe('mergeDirectoryIntoTree', () => {
  it('should merge at root level', () => {
    const root = makeDir('/root', 'root');
    const fetched = makeDir('/root', 'root', {
      files: [
        {
          id: '1',
          name: 'new.ts',
          path: '/root/new.ts',
          updatedAt: '',
          type: Enums.FileType.TS,
        },
      ],
    });
    const result = mergeDirectoryIntoTree(root, '/root', fetched);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('new.ts');
  });

  it('should merge at nested target', () => {
    const root = makeDir('/root', 'root', {
      directories: [makeDir('/root/a', 'a')],
    });
    const fetched = makeDir('/root/a', 'a', {
      directories: [makeDir('/root/a/b', 'b')],
    });
    const result = mergeDirectoryIntoTree(root, '/root/a', fetched);
    expect(result.directories[0].directories).toHaveLength(1);
    expect(result.directories[0].directories[0].name).toBe('b');
  });
});

describe('refreshDirectoryInTree', () => {
  it('should replace root entirely', () => {
    const root = makeDir('/root', 'root', {
      directories: [makeDir('/root/old', 'old')],
    });
    const fetched = makeDir('/root', 'root-new', {
      directories: [makeDir('/root/new', 'new')],
    });
    const result = refreshDirectoryInTree(root, '/root', fetched);
    expect(result.name).toBe('root-new');
    expect(result.directories[0].name).toBe('new');
  });

  it('should replace nested directory', () => {
    const root = makeDir('/root', 'root', {
      directories: [makeDir('/root/a', 'a')],
    });
    const fetched = makeDir('/root/a', 'a-refreshed');
    const result = refreshDirectoryInTree(root, '/root/a', fetched);
    expect(result.directories[0].name).toBe('a-refreshed');
  });
});
