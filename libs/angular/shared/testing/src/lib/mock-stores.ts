import { signal } from '@angular/core';

export function mockGitStatusStore(rootPath = '/workspace/repo') {
  return {
    rootPath: signal(rootPath),
    branch: signal('main'),
    tracking: signal(true),
    branches: signal([]),
    stagedCount: signal(0),
    changesCount: signal(0),
    ahead: signal(0),
    behind: signal(0),
    updateGitStatus: vi.fn(),
    listBranches: vi.fn(),
    loadGitStatus: vi.fn(),
    listenToGitChanges: vi.fn(),
    checkout: vi.fn(),
    createBranch: vi.fn(),
  };
}

export function mockCodeEditorStore() {
  return {
    openFiles: signal([]),
    openFilePaths: signal([]),
    activeTabId: signal(null),
    activeFile: signal(null),
    openFile: vi.fn(),
    openDiff: vi.fn(),
    closeFile: vi.fn(),
    setActiveFile: vi.fn(),
    closeAll: vi.fn(),
    saveFile: vi.fn(),
    updateContent: vi.fn(),
    initialize: vi.fn(),
  };
}

export function mockFileExplorerStore() {
  return {
    rootPath: signal('/workspace/repo'),
    directory: signal(null),
    file: signal(null),
    loading: signal(false),
    getDirectory: vi.fn(),
    expandDirectory: vi.fn(),
    getFile: vi.fn(),
    rename: vi.fn(),
    createFile: vi.fn(),
    createDirectory: vi.fn(),
    delete: vi.fn(),
    navigateToFile: vi.fn(),
    revealFile: vi.fn().mockResolvedValue(null),
    listenToFileChanges: vi.fn(),
  };
}

export function mockAuthStore(overrides?: { rootPath?: string }) {
  return {
    profile: signal({ username: 'testuser', avatarUrl: '' }),
    workspace: signal({
      rootPath: overrides?.rootPath ?? '/workspace/repo',
      repoUrl: 'https://github.com/test/repo',
    }),
    authenticated: signal(true),
    permissions: signal([]),
    canWrite: signal(true),
    isLoading: signal(false),
    errorMessage: signal(''),
    getLoginInfo: vi.fn(),
    guestLogin: vi.fn(),
    cloneRepo: vi.fn(),
    logout: vi.fn(),
  };
}
