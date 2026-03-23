import { Terminal as TerminalContracts } from '@org/shared/contracts';
import type { TerminalSocketAdapter } from './terminal-socket.adapter';
import { TerminalSession } from './terminal-session';
import { getTerminalTheme } from './terminal-theme';

const MAX_SESSIONS = 4;
const STORAGE_KEY = 'ide-terminal-tabs';

export interface TerminalTabInfo {
  sessionId: string;
  name: string;
}

export type TerminalStateCallback = (tabs: TerminalTabInfo[], activeId: string | null) => void;

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();
  private tabs: TerminalTabInfo[] = [];
  private activeId: string | null = null;
  private isDark = true;
  private tabCounter = 0;
  private disposed = false;
  private stateCallback: TerminalStateCallback | null = null;

  setStateCallback(callback: TerminalStateCallback): void {
    this.stateCallback = callback;
  }

  getSavedTabCount(): number {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).count ?? 1 : 1;
    } catch {
      return 1;
    }
  }

  async createSession(
    container: HTMLElement,
    socket: TerminalSocketAdapter,
    cwd: string,
  ): Promise<string | null> {
    if (this.disposed || this.sessions.size >= MAX_SESSIONS) return null;

    return new Promise<string | null>((resolve) => {
      let settled = false;

      const settle = () => {
        settled = true;
        unsub();
        unsubError();
        unsubConnect?.();
      };

      const timeout = setTimeout(() => {
        if (settled) return;
        settle();
        container.remove();
        resolve(null);
      }, 5000);

      const unsubError = socket.on<TerminalContracts.TerminalErrorDto>(
        TerminalContracts.TERMINAL_ERROR_EVENT,
        (error) => {
          if (settled) return;
          clearTimeout(timeout);
          settle();
          container.remove();
          resolve(null);
          console.error('[TerminalManager] Error:', error.message);
        },
      );

      const unsub = socket.on<TerminalContracts.TerminalCreatedResponseDto>(
        TerminalContracts.TERMINAL_CREATED_EVENT,
        (response) => {
          if (settled) return;
          clearTimeout(timeout);
          settle();

          if (this.disposed) {
            container.remove();
            resolve(null);
            return;
          }

          const session = new TerminalSession(
            response.sessionId,
            container,
            socket,
            getTerminalTheme(this.isDark),
            (sessionId) => this.handleSessionExit(sessionId, socket),
          );

          this.sessions.set(response.sessionId, session);
          this.tabCounter++;
          this.tabs = [
            ...this.tabs,
            { sessionId: response.sessionId, name: `Terminal ${this.tabCounter}` },
          ];
          this.setActive(response.sessionId);
          resolve(response.sessionId);
        },
      );

      let unsubConnect: (() => void) | null = null;
      unsubConnect = socket.onConnect(() => {
        unsubConnect?.();
        unsubConnect = null;
        if (this.disposed) return;
        socket.emit(TerminalContracts.TERMINAL_CREATE_EVENT, {
          cols: 80,
          rows: 24,
          cwd,
        } satisfies TerminalContracts.TerminalCreateRequestDto);
      });
    });
  }

  closeSession(sessionId: string, socket: TerminalSocketAdapter): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    socket.emit(TerminalContracts.TERMINAL_CLOSE_EVENT, {
      sessionId,
    } satisfies TerminalContracts.TerminalCloseDto);

    const container = session.terminal.element?.parentElement;
    session.dispose();
    container?.remove();
    this.sessions.delete(sessionId);
    this.tabs = this.tabs.filter((t) => t.sessionId !== sessionId);

    if (this.activeId === sessionId) {
      const next = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].sessionId : null;
      if (next) {
        this.showSessionContainer(next);
        this.setActive(next);
      } else {
        this.activeId = null;
        this.notifyState();
      }
    } else {
      this.notifyState();
    }
  }

  setActive(sessionId: string): void {
    this.activeId = sessionId;
    this.notifyState();

    for (const [id, session] of this.sessions) {
      session.terminal.element?.parentElement?.classList.toggle(
        'terminal-container-active',
        id === sessionId,
      );
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      requestAnimationFrame(() => {
        session.fit();
        session.focus();
      });
    }
  }

  startResize(
    event: MouseEvent,
    currentHeight: number,
    onHeight: (height: number) => void,
    socket: TerminalSocketAdapter,
  ): void {
    event.preventDefault();
    const startY = event.clientY;

    const onMouseMove = (e: MouseEvent) => {
      onHeight(currentHeight + (startY - e.clientY));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.resizeActive(socket);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  fitActive(): void {
    if (!this.activeId) return;
    this.sessions.get(this.activeId)?.fit();
  }

  resizeActive(socket: TerminalSocketAdapter): void {
    if (!this.activeId) return;
    const sessionId = this.activeId;
    const session = this.sessions.get(sessionId);
    if (!session) return;

    requestAnimationFrame(() => {
      session.fit();
      const { cols, rows } = session.terminal;
      socket.emit(TerminalContracts.TERMINAL_RESIZE_EVENT, {
        sessionId,
        cols,
        rows,
      } satisfies TerminalContracts.TerminalResizeDto);
    });
  }

  setTheme(isDark: boolean): void {
    this.isDark = isDark;
    const theme = getTerminalTheme(isDark);
    for (const session of this.sessions.values()) {
      session.setTheme(theme);
    }
  }

  disposeAll(socket: TerminalSocketAdapter): void {
    this.disposed = true;
    for (const [sessionId, session] of this.sessions) {
      socket.emit(TerminalContracts.TERMINAL_CLOSE_EVENT, {
        sessionId,
      } satisfies TerminalContracts.TerminalCloseDto);
      const container = session.terminal.element?.parentElement;
      session.dispose();
      container?.remove();
    }
    this.sessions.clear();
    this.tabs = [];
    this.activeId = null;
    this.stateCallback = null;
  }

  getTabs(): TerminalTabInfo[] {
    return this.tabs;
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  private handleSessionExit(sessionId: string, socket: TerminalSocketAdapter): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const container = session.terminal.element?.parentElement;
      session.dispose();
      container?.remove();
      this.sessions.delete(sessionId);
      this.tabs = this.tabs.filter((t) => t.sessionId !== sessionId);

      if (this.activeId === sessionId) {
        const next = this.tabs.length > 0 ? this.tabs[this.tabs.length - 1].sessionId : null;
        if (next) {
          this.showSessionContainer(next);
          this.setActive(next);
        } else {
          this.activeId = null;
          this.notifyState();
        }
      } else {
        this.notifyState();
      }
    }
  }

  private showSessionContainer(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    const container = session?.terminal.element?.parentElement;
    if (container) {
      container.style.display = 'block';
      container.style.height = '100%';
    }
  }

  private notifyState(): void {
    this.persistTabCount();
    this.stateCallback?.(this.tabs, this.activeId);
  }

  private persistTabCount(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: this.tabs.length }));
    } catch {
      // ignore
    }
  }
}
