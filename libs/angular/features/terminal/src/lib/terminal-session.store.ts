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

      manager.setTheme(document.documentElement.classList.contains('dark'));
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
  })),
);

async function doCreateSession(store: StoreProps): Promise<void> {
  const cwd = store.authStore.workspace()?.rootPath;
  if (!cwd || !store.manager || !store.hostElement) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'terminal-container';
  hideAllContainers(store.hostElement);
  wrapper.style.display = 'block';
  wrapper.style.height = '100%';
  store.hostElement.appendChild(wrapper);

  const sessionId = await store.manager.createSession(wrapper, store.terminalWs, cwd);
  if (sessionId) {
    wrapper.dataset['sessionId'] = sessionId;
  }
}

async function restoreSessions(store: StoreProps): Promise<void> {
  if (!store.manager) return;
  const count = store.manager.getSavedTabCount();
  for (let i = 0; i < count; i++) {
    await doCreateSession(store);
  }
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
