import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import {
  mockSnackbarService,
  mockGitService,
  mockGitStatusStore,
  mockFileExplorerService,
  mockCodeEditorStore,
  mockWebSocketStore,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { FileExplorerService, GitService, GitStatusStore, IdeStore } from '@org/angular-data-access';
import { GitChangesStore } from './git-changes.store';

describe('GitChangesStore', () => {
  function setup() {
    const git = mockGitService();
    const snackbar = mockSnackbarService();
    const gitStatus = mockGitStatusStore();
    const fileService = mockFileExplorerService();
    const editor = mockCodeEditorStore();
    const ws = mockWebSocketStore();

    TestBed.configureTestingModule({
      providers: [
        GitChangesStore,
        { provide: GitService, useValue: git },
        { provide: SnackbarService, useValue: snackbar },
        { provide: GitStatusStore, useValue: gitStatus },
        { provide: FileExplorerService, useValue: fileService },
        { provide: IdeStore.CodeEditorStore, useValue: editor },
        { provide: sockets.WebSocketStore, useValue: ws },
      ],
    });
    return { store: TestBed.inject(GitChangesStore), git, snackbar, gitStatus, fileService, editor };
  }

  it('should initialize with null changesTree', () => {
    const { store } = setup();
    expect(store.changesTree()).toBeNull();
    expect(store.statusMap()).toEqual({});
  });

  it('should load status and update git status store', () => {
    const { store, git, gitStatus } = setup();
    const treeData = {
      tree: { path: '/workspace/repo', name: 'repo', type: 'directory', children: [] },
      statusMap: { 'src/main.ts': 'M' },
      branch: 'develop',
      stagedCount: 1,
      changesCount: 2,
      ahead: 0,
      behind: 0,
    };
    git.getStatusTree.mockReturnValue(of({ success: true, data: treeData, error: null }));
    store.getStatus('/workspace/repo');
    expect(store.changesTree()).toEqual(treeData.tree);
    expect(store.statusMap()).toEqual({ 'src/main.ts': 'M' });
    expect(gitStatus.updateGitStatus).toHaveBeenCalledWith({
      branch: 'develop',
      stagedCount: 1,
      changesCount: 2,
      ahead: 0,
      behind: 0,
    });
  });

  it('should open diff by fetching head and current file', () => {
    const { store, git, fileService, editor } = setup();
    git.showDiff.mockReturnValue(
      of({ success: true, data: { content: 'original' }, error: null }),
    );
    fileService.getFile.mockReturnValue(
      of({
        success: true,
        data: { id: '1', name: 'main.ts', path: '/workspace/repo/src/main.ts', content: 'modified', type: 'file', extension: '.ts' },
        error: null,
      }),
    );
    store.openDiff('src/main.ts');
    expect(git.showDiff).toHaveBeenCalledWith('/workspace/repo', 'src/main.ts');
    expect(fileService.getFile).toHaveBeenCalledWith('/workspace/repo/src/main.ts');
    expect(editor.openDiff).toHaveBeenCalled();
  });

  it('should not open diff when showDiff fails', () => {
    const { store, git, fileService, editor } = setup();
    git.showDiff.mockReturnValue(of({ success: false, data: null, error: 'error' }));
    fileService.getFile.mockReturnValue(
      of({ success: true, data: { path: 'test' }, error: null }),
    );
    store.openDiff('src/main.ts');
    expect(editor.openDiff).not.toHaveBeenCalled();
  });
});
