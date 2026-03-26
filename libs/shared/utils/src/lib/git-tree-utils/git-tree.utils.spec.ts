import { GitFileStatus, type GitStatusDto } from '@org/shared/contracts';
import {
  compactDirectory,
  buildGitChangesTree,
  buildGitStatusMap,
  stripGitSectionPrefix,
} from './git-tree.utils';
import { Enums } from '@org/shared/contracts';
import type { DirectoryResponseDto } from '@org/shared/contracts';

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

function makeStatus(overrides?: Partial<GitStatusDto>): GitStatusDto {
  return {
    branch: 'main',
    tracking: true,
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    ...overrides,
  };
}

describe('compactDirectory', () => {
  it('should compact single-child directory chains', () => {
    const dir = makeDir('/a', 'a', {
      directories: [makeDir('/a/b', 'b', { directories: [makeDir('/a/b/c', 'c')] })],
    });
    const result = compactDirectory(dir);
    expect(result.name).toBe('a/b/c');
    expect(result.path).toBe('/a/b/c');
  });

  it('should not compact directory with multiple children', () => {
    const dir = makeDir('/a', 'a', {
      directories: [makeDir('/a/b', 'b'), makeDir('/a/c', 'c')],
    });
    const result = compactDirectory(dir);
    expect(result.name).toBe('a');
    expect(result.directories).toHaveLength(2);
  });

  it('should not compact directory with files', () => {
    const dir = makeDir('/a', 'a', {
      files: [
        {
          id: '1',
          name: 'f.ts',
          path: '/a/f.ts',
          updatedAt: '',
          type: Enums.FileType.TS,
        },
      ],
      directories: [makeDir('/a/b', 'b')],
    });
    const result = compactDirectory(dir);
    expect(result.name).toBe('a');
  });
});

describe('buildGitChangesTree', () => {
  it('should build tree with staged files', () => {
    const status = makeStatus({
      staged: [{ path: 'src/app.ts', status: GitFileStatus.MODIFIED }],
    });
    const tree = buildGitChangesTree(status);
    expect(tree.directories).toHaveLength(1);
    expect(tree.directories[0].name).toContain('Staged');
  });

  it('should build tree with changes (unstaged + untracked)', () => {
    const status = makeStatus({
      unstaged: [{ path: 'src/lib.ts', status: GitFileStatus.MODIFIED }],
      untracked: ['new-file.ts'],
    });
    const tree = buildGitChangesTree(status);
    expect(tree.directories).toHaveLength(1);
    expect(tree.directories[0].name).toContain('Changes');
  });

  it('should build tree with both sections', () => {
    const status = makeStatus({
      staged: [{ path: 'a.ts', status: GitFileStatus.ADDED }],
      unstaged: [{ path: 'b.ts', status: GitFileStatus.DELETED }],
    });
    const tree = buildGitChangesTree(status);
    expect(tree.directories).toHaveLength(2);
  });

  it('should return empty tree when no changes', () => {
    const tree = buildGitChangesTree(makeStatus());
    expect(tree.directories).toHaveLength(0);
    expect(tree.files).toHaveLength(0);
  });
});

describe('buildGitStatusMap', () => {
  it('should map staged files with status letter', () => {
    const status = makeStatus({
      staged: [{ path: 'file.ts', status: GitFileStatus.MODIFIED }],
    });
    const map = buildGitStatusMap(status);
    expect(map['/staged/file.ts']).toBe('M');
  });

  it('should map unstaged files', () => {
    const status = makeStatus({
      unstaged: [{ path: 'file.ts', status: GitFileStatus.ADDED }],
    });
    const map = buildGitStatusMap(status);
    expect(map['/changes/file.ts']).toBe('A');
  });

  it('should map untracked files as U', () => {
    const status = makeStatus({ untracked: ['new.ts'] });
    const map = buildGitStatusMap(status);
    expect(map['/changes/new.ts']).toBe('U');
  });

  it('should map all status types', () => {
    const status = makeStatus({
      staged: [
        { path: 'deleted.ts', status: GitFileStatus.DELETED },
        { path: 'renamed.ts', status: GitFileStatus.RENAMED },
        { path: 'copied.ts', status: GitFileStatus.COPIED },
      ],
    });
    const map = buildGitStatusMap(status);
    expect(map['/staged/deleted.ts']).toBe('D');
    expect(map['/staged/renamed.ts']).toBe('R');
    expect(map['/staged/copied.ts']).toBe('C');
  });
});

describe('stripGitSectionPrefix', () => {
  it('should strip /staged/ prefix', () => {
    expect(stripGitSectionPrefix('/staged/src/app.ts')).toBe('src/app.ts');
  });

  it('should strip /changes/ prefix', () => {
    expect(stripGitSectionPrefix('/changes/src/lib.ts')).toBe('src/lib.ts');
  });

  it('should pass through paths without prefix', () => {
    expect(stripGitSectionPrefix('src/app.ts')).toBe('src/app.ts');
  });
});
