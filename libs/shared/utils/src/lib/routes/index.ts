const IDE_BASE = '/ide';

export const AppRoutes = {
  login: '/login',
  ide: {
    root: IDE_BASE,
    cloneRepo: `${IDE_BASE}/clone-repo`,
    explorer: `${IDE_BASE}/explorer`,
    git: `${IDE_BASE}/git`,
    ai: `${IDE_BASE}/ai`,
    explorerWithFile: (filePath: string) =>
      `${IDE_BASE}/explorer?filePath=${encodeURIComponent(filePath)}`,
    withFile: (currentUrl: string, filePath: string) => {
      const basePath = currentUrl.split('?')[0];
      return `${basePath}?filePath=${encodeURIComponent(filePath)}`;
    },
    panel: (panel: string) => `${IDE_BASE}/${panel}`,
  },
} as const;
