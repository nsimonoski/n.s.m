import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import {
  mockSnackbarService,
  mockGitService,
  mockGitStatusStore,
  mockWebSocketStore,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { GitService, GitStatusStore } from '@org/angular-data-access';
import { GitCommitStore } from './git-commit.store';

describe('GitCommitStore', () => {
  function setup() {
    localStorage.clear();
    const git = mockGitService();
    const snackbar = mockSnackbarService();
    const gitStatus = mockGitStatusStore();
    const ws = mockWebSocketStore();
    TestBed.configureTestingModule({
      providers: [
        GitCommitStore,
        { provide: GitService, useValue: git },
        { provide: SnackbarService, useValue: snackbar },
        { provide: GitStatusStore, useValue: gitStatus },
        { provide: sockets.WebSocketStore, useValue: ws },
      ],
    });
    return { store: TestBed.inject(GitCommitStore), git, snackbar };
  }

  it('should initialize with empty commit message', () => {
    const { store } = setup();
    expect(store.commitMessage()).toBe('');
    expect(store.commitHistory()).toEqual([]);
  });

  it('should commit and show success', () => {
    const { store, git, snackbar } = setup();
    git.commit.mockReturnValue(of({ success: true, data: {}, error: null }));
    store.commit('feat: add feature');
    expect(git.commit).toHaveBeenCalledWith('/workspace/repo', 'feat: add feature');
    expect(snackbar.success).toHaveBeenCalledWith('Committed!', undefined);
  });

  it('should show error on commit failure', () => {
    const { store, git, snackbar } = setup();
    git.commit.mockReturnValue(of({ success: false, error: 'Nothing to commit' }));
    store.commit('empty');
    expect(snackbar.error).toHaveBeenCalledWith('Nothing to commit', undefined);
  });

  it('should clear commit message on successful commit', () => {
    const { store, git } = setup();
    git.commit.mockReturnValue(of({ success: true, data: {}, error: null }));
    store.commit('feat: something');
    const saved = JSON.parse(localStorage.getItem('git-explorer') ?? '{}');
    expect(saved.commitMessage).toBe('');
  });

  it('should fetch commit log', () => {
    const { store, git } = setup();
    const logEntries = [
      { hash: 'abc123', message: 'initial commit', author: 'test', date: '2024-01-01' },
    ];
    git.getLog.mockReturnValue(of({ success: true, data: logEntries, error: null }));
    store.fetchLog('/workspace/repo');
    expect(store.commitHistory()).toEqual(logEntries);
  });

  it('should sync via gitPush', () => {
    const { store, git, snackbar } = setup();
    git.push.mockReturnValue(of({ success: true, data: null, error: null }));
    store.sync();
    expect(git.push).toHaveBeenCalledWith('/workspace/repo');
    expect(snackbar.success).toHaveBeenCalledWith('Pushed!', undefined);
  });
});
