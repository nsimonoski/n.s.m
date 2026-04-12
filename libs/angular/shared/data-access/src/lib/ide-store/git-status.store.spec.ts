import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import {
  mockSnackbarService,
  mockGitService,
  mockAuthStore,
  mockWebSocketStore,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { GitService } from '../git.service';
import { GitStatusStore } from './git-status.store';
import { AuthStore } from './auth.store';

describe('GitStatusStore', () => {
  function setup() {
    const git = mockGitService();
    const snackbar = mockSnackbarService();
    TestBed.configureTestingModule({
      providers: [
        { provide: GitService, useValue: git },
        { provide: SnackbarService, useValue: snackbar },
        { provide: AuthStore, useValue: mockAuthStore() },
        { provide: sockets.WebSocketStore, useValue: mockWebSocketStore() },
      ],
    });
    return { store: TestBed.inject(GitStatusStore), git, snackbar };
  }

  it('should initialize rootPath from AuthStore', () => {
    const { store } = setup();
    expect(store.rootPath()).toBe('/workspace/repo');
  });

  it('should update git status partially', () => {
    const { store } = setup();
    store.updateGitStatus({ branch: 'develop', ahead: 3, behind: 1 });
    expect(store.branch()).toBe('develop');
    expect(store.ahead()).toBe(3);
    expect(store.behind()).toBe(1);
  });

  it('should list branches and set current', () => {
    const { store, git } = setup();
    git.listBranches.mockReturnValue(
      of({
        success: true,
        data: [
          { name: 'main', current: false },
          { name: 'feature', current: true },
        ],
        error: null,
      }),
    );
    store.listBranches();
    expect(store.branch()).toBe('feature');
    expect(store.branches().length).toBe(2);
  });

  it('should checkout branch and refresh branch list', () => {
    const { store, git } = setup();
    git.checkout.mockReturnValue(of({ success: true, data: null, error: null }));
    git.listBranches.mockReturnValue(
      of({
        success: true,
        data: [{ name: 'develop', current: true }],
        error: null,
      }),
    );
    store.checkout('develop');
    expect(git.checkout).toHaveBeenCalledWith('/workspace/repo', 'develop');
    expect(store.branch()).toBe('develop');
  });

  it('should show error when checkout fails', () => {
    const { store, git, snackbar } = setup();
    git.checkout.mockReturnValue(of({ success: false, data: null, error: 'Branch not found' }));
    store.checkout('nonexistent');
    expect(snackbar.error).toHaveBeenCalledWith('Branch not found', undefined);
  });

  it('should create branch and show success', () => {
    const { store, git, snackbar } = setup();
    git.createBranch.mockReturnValue(of({ success: true, data: null, error: null }));
    git.listBranches.mockReturnValue(
      of({
        success: true,
        data: [{ name: 'new-branch', current: true }],
        error: null,
      }),
    );
    store.createBranch({ branch: 'new-branch' });
    expect(git.createBranch).toHaveBeenCalledWith('/workspace/repo', 'new-branch', undefined);
    expect(snackbar.success).toHaveBeenCalled();
  });
});
