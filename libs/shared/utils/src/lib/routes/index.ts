const IDE_BASE = '/ide';

export const AppRoutes = {
  login: '/login',
  cloneRepo: '/clone-repo',
  ide: {
    root: IDE_BASE,
    explorer: `${IDE_BASE}/explorer`,
    git: `${IDE_BASE}/git`,
    explorerWithFile: (filePath: string) =>
      `${IDE_BASE}/explorer?filePath=${encodeURIComponent(filePath)}`,
    panel: (panel: string) => `${IDE_BASE}/${panel}`,
  },
} as const;
