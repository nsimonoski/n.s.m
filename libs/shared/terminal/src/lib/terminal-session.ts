import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import type { ITheme } from '@xterm/xterm';
import { Terminal as TerminalContracts } from '@org/shared/contracts';
import type { TerminalSocketAdapter } from './terminal-socket.adapter';

const FONT_FAMILY = 'Menlo, Monaco, "Courier New", monospace';

export class TerminalSession {
  readonly terminal: Terminal;
  private readonly fitAddon: FitAddon;
  private readonly resizeObserver: ResizeObserver;
  private readonly unsubscribes: (() => void)[] = [];
  private _sessionId: string | null = null;

  get sessionId(): string | null {
    return this._sessionId;
  }

  constructor(container: HTMLElement, theme: ITheme) {
    this.terminal = new Terminal({
      theme,
      fontSize: 13,
      fontFamily: FONT_FAMILY,
      cursorBlink: true,
      allowProposedApi: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());

    this.terminal.open(container);

    this.resizeObserver = new ResizeObserver(() => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        this.fitAddon.fit();
      }
    });
    this.resizeObserver.observe(container);
  }

  connect(
    sessionId: string,
    socket: TerminalSocketAdapter,
    onExit: (sessionId: string, exitCode: number) => void,
  ): void {
    this._sessionId = sessionId;

    this.terminal.onData((data) => {
      socket.emit(TerminalContracts.TERMINAL_DATA_EVENT, {
        sessionId,
        data,
      } satisfies TerminalContracts.TerminalDataDto);
    });

    const unsubData = socket.on<TerminalContracts.TerminalDataDto>(
      TerminalContracts.TERMINAL_DATA_EVENT,
      (payload) => {
        if (payload.sessionId === sessionId) {
          this.terminal.write(payload.data);
        }
      },
    );
    this.unsubscribes.push(unsubData);

    const unsubExit = socket.on<TerminalContracts.TerminalExitDto>(
      TerminalContracts.TERMINAL_EXIT_EVENT,
      (payload) => {
        if (payload.sessionId === sessionId) {
          onExit(sessionId, payload.exitCode);
        }
      },
    );
    this.unsubscribes.push(unsubExit);
  }

  fit(): void {
    this.fitAddon.fit();
  }

  focus(): void {
    this.terminal.focus();
  }

  setTheme(theme: ITheme): void {
    this.terminal.options.theme = theme;
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.terminal.dispose();
  }
}
