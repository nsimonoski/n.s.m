import { signal } from '@angular/core';
import { EMPTY, of } from 'rxjs';

export function mockSnackbarService() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
    state: signal({ message: '', type: 'info', visible: false }),
  };
}

export function mockGitService() {
  return {
    getStatus: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    getStatusTree: vi.fn().mockReturnValue(
      of({
        success: true,
        data: {
          branch: 'main',
          tracking: true,
          stagedCount: 0,
          changesCount: 0,
          ahead: 0,
          behind: 0,
          staged: [],
          changes: [],
          tree: null,
          statusMap: {},
        },
        error: null,
      }),
    ),
    stage: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    unstage: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    discard: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    commit: vi.fn().mockReturnValue(of({ success: true, data: {}, error: null })),
    push: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    showDiff: vi.fn().mockReturnValue(of({ success: true, data: { content: '' }, error: null })),
    stash: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    stashPop: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    stashApply: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    listBranches: vi.fn().mockReturnValue(of({ success: true, data: [], error: null })),
    getLog: vi.fn().mockReturnValue(of({ success: true, data: [], error: null })),
    checkout: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    createBranch: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
  };
}

export function mockFileExplorerService() {
  return {
    readDirectory: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    getFile: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    getFiles: vi.fn().mockReturnValue(of({ success: true, data: [], error: null })),
    updateFile: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    rename: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    createFile: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    createDirectory: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    searchFiles: vi.fn().mockReturnValue(of({ success: true, data: [], error: null })),
    delete: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
  };
}

export function mockAuthService() {
  return {
    getLoginInfo: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    guestLogin: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    logout: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    getGithubAuthUrl: vi.fn().mockReturnValue('/api/github/auth'),
  };
}

export function mockWorkspaceService() {
  return {
    cloneRepo: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
    cloneDemoRepo: vi.fn().mockReturnValue(of({ success: true, data: null, error: null })),
  };
}

export function mockAiService() {
  return {
    sendMessage: vi.fn().mockReturnValue(EMPTY),
  };
}
