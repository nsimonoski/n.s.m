import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '@org/angular/ui';
import {
  mockSnackbarService,
  mockAuthService,
  mockWorkspaceService,
  mockWebSocketStore,
  mockRouter,
  mockActivatedRoute,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { AuthService } from '../auth.service';
import { WorkspaceService } from '../workspace.service';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  function setup() {
    localStorage.clear();
    const auth = mockAuthService();
    const workspace = mockWorkspaceService();
    const snackbar = mockSnackbarService();
    const ws = mockWebSocketStore();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: WorkspaceService, useValue: workspace },
        { provide: SnackbarService, useValue: snackbar },
        { provide: sockets.WebSocketStore, useValue: ws },
        { provide: Router, useValue: mockRouter() },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
      ],
    });
    return { store: TestBed.inject(AuthStore), auth, workspace, snackbar, ws };
  }

  it('should initialize with null profile and workspace', () => {
    const { store } = setup();
    expect(store.profile()).toBeNull();
    expect(store.workspace()).toBeNull();
  });

  it('should compute authenticated from profile', () => {
    const { store } = setup();
    expect(store.authenticated()).toBe(false);
  });

  it('should compute canWrite from permissions', () => {
    const { store } = setup();
    expect(store.canWrite()).toBe(false);
  });

  it('should return cached result if profile already loaded', () => {
    const { store, auth } = setup();
    auth.getLoginInfo.mockReturnValue(
      of({ success: true, data: { username: 'test', permissions: [] }, error: null }),
    );
    store.getLoginInfo().subscribe();
    // Second call should skip service
    auth.getLoginInfo.mockClear();
    store.getLoginInfo().subscribe((result) => {
      expect(result).toBe(true);
    });
    expect(auth.getLoginInfo).not.toHaveBeenCalled();
  });

  it('should call getLoginInfo and save profile on success', () => {
    const { store, auth } = setup();
    const profile = { username: 'testuser', permissions: ['FileWrite'] };
    auth.getLoginInfo.mockReturnValue(of({ success: true, data: profile, error: null }));
    store.getLoginInfo().subscribe((result) => {
      expect(result).toBe(true);
    });
    expect(store.profile()).toEqual(profile);
  });

  it('should return false when getLoginInfo fails', () => {
    const { store, auth } = setup();
    auth.getLoginInfo.mockReturnValue(of({ success: false, data: null, error: 'Unauthorized' }));
    store.getLoginInfo().subscribe((result) => {
      expect(result).toBe(false);
    });
  });

  it('should return github auth url from service', () => {
    const { store, auth } = setup();
    auth.getGithubAuthUrl.mockReturnValue('/api/github/callback');
    expect(store.githubAuthUrl()).toBe('/api/github/callback');
  });

  it('should clone repo and navigate on success', () => {
    const { store, workspace, ws } = setup();
    const workspaceData = { rootPath: '/workspace/clone', repoUrl: 'https://github.com/test/repo' };
    workspace.cloneRepo.mockReturnValue(of({ success: true, data: workspaceData, error: null }));
    store.cloneRepo('https://github.com/test/repo');
    expect(workspace.cloneRepo).toHaveBeenCalledWith('https://github.com/test/repo');
    expect(ws.reconnect).toHaveBeenCalled();
    expect(store.workspace()).toEqual(workspaceData);
  });

  it('should set error when clone fails', () => {
    const { store, workspace } = setup();
    workspace.cloneRepo.mockReturnValue(of({ success: false, data: null, error: 'Clone failed' }));
    store.cloneRepo('bad-url');
    expect(store.errorMessage()).toBe('Failed to clone repository. Check the URL and try again.');
  });
});
