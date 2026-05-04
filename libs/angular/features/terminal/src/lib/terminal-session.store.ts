import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { IdeStore, TerminalWsService } from '@org/angular-data-access';
import { TerminalManager, TerminalTabInfo } from '@org/shared/terminal';

export interface TerminalSessionState {
  tabs: TerminalTabInfo[];
  activeSessionId: string | null;
}

type StoreProps = {
  manager: TerminalManager | null;
  hostElement: HTMLElement | null;
  terminalWs: TerminalWsService;
  authStore: InstanceType<typeof IdeStore.AuthStore>;
};

export const TerminalSessionStore = signalStore(
  { providedIn: 'root' },
  withState<TerminalSessionState>({
    tabs: [],
    activeSessionId: null,
  }),
  withProps(() => ({
    manager: null as TerminalManager | null,
    hostElement: null as HTMLElement | null,
    terminalWs: inject(TerminalWsService),
    authStore: inject(IdeStore.AuthStore),
    layoutStore: inject(IdeStore.IdeLayoutStore),
  })),
  withMethods((store) => ({
    init(host: HTMLElement): void {
      const manager = new TerminalManager();
      store.manager = manager;
      store.hostElement = host;

      manager.setStateCallback((newTabs, newActiveId) => {
        patchState(store, { tabs: [...newTabs], activeSessionId: newActiveId });
        if (newTabs.length === 0) {
          store.layoutStore.closeTerminal();
        }
      });

      manager.setTheme(document.documentElement.getAttribute('data-theme') === 'dark');
      restoreSessions(store);
    },

    dispose(): void {
      store.manager?.disposeAll(store.terminalWs);
      store.manager = null;
      store.hostElement = null;
      patchState(store, { tabs: [], activeSessionId: null });
    },

    async createSession(): Promise<void> {
      await doCreateSession(store);
    },

    closeSession(sessionId: string): void {
      store.manager?.closeSession(sessionId, store.terminalWs);
    },

    setActive(sessionId: string): void {
      if (!store.manager || !store.hostElement) return;

      hideAllContainers(store.hostElement);
      store.manager.setActive(sessionId);

      const container = store.hostElement.querySelector(
        `.terminal-container[data-session-id="${sessionId}"]`,
      ) as HTMLElement | null;
      if (container) {
        showContainer(store.hostElement, container);
      }
    },

    startResize(event: MouseEvent, currentHeight: number, onHeight: (h: number) => void): void {
      store.manager?.startResize(event, currentHeight, onHeight, store.terminalWs);
    },

    setTheme(isDark: boolean): void {
      store.manager?.setTheme(isDark);
    },

    requestNew(): void {
      doCreateSession(store);
    },

    async ensureSession(): Promise<string | null> {
      if (!store.layoutStore.terminalOpen()) {
        store.layoutStore.toggleTerminal();
      }

      const existing = store.activeSessionId();
      if (existing) return existing;

      const restored = await waitForSession(store, 2000);
      if (restored) return restored;

      await doCreateSession(store);
      return (
        store.activeSessionId() ?? (await waitForSession(store, 5000))
      );
    },
  })),
);

async function doCreateSession(store: StoreProps): Promise<boolean> {
  const cwd = store.authStore.workspace()?.rootPath;
  if (!cwd || !store.manager || !store.hostElement) return false;

  const wrapper = document.createElement('div');
  wrapper.className = 'terminal-container';
  hideAllContainers(store.hostElement);
  wrapper.style.display = 'block';
  wrapper.style.height = '100%';
  store.hostElement.appendChild(wrapper);

  const sessionId = await store.manager.createSession(wrapper, store.terminalWs, cwd);
  if (sessionId) {
    wrapper.dataset['sessionId'] = sessionId;
    return true;
  }

  wrapper.remove();
  return false;
}

async function restoreSessions(store: StoreProps): Promise<void> {
  if (!store.manager) return;
  const count = store.manager.getSavedTabCount();
  if (count === 0) return;

  const connected = await waitForConnection(store.terminalWs);
  if (!connected) return;

  for (let i = 0; i < count; i++) {
    const ok = await createWithRetry(store);
    if (!ok) break;
  }
}

async function createWithRetry(store: StoreProps, maxAttempts = 3): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await delay(1000 * attempt);
    }
    if (await doCreateSession(store)) return true;
  }
  return false;
}

function waitForConnection(socket: TerminalWsService): Promise<boolean> {
  return new Promise((resolve) => {
    let unsub: (() => void) | null = null;
    let settled = false;

    const finish = (connected: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsub?.();
      resolve(connected);
    };

    const timeout = setTimeout(() => finish(false), 10_000);

    unsub = socket.onConnect(() => finish(true));

    if (settled) unsub();
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForSession(
  store: { activeSessionId: () => string | null },
  timeoutMs: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const id = store.activeSessionId();
      if (id) return resolve(id);
      if (Date.now() - start >= timeoutMs) return resolve(null);
      setTimeout(tick, 50);
    };
    tick();
  });
}

function hideAllContainers(host: HTMLElement): void {
  host
    .querySelectorAll('.terminal-container')
    .forEach((el) => ((el as HTMLElement).style.display = 'none'));
}

function showContainer(host: HTMLElement, el: HTMLElement): void {
  hideAllContainers(host);
  el.style.display = 'block';
  el.style.height = '100%';
}
