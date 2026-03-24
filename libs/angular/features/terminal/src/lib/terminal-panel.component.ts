import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { IdeStore, TerminalWsService } from '@org/angular-data-access';
import { ThemeStore } from '@org/angular/ui';
import { TerminalManager, TerminalTabInfo } from '@org/shared/terminal';
import '@xterm/xterm/css/xterm.css';

@Component({
  selector: 'ide-terminal-panel',
  standalone: true,
  templateUrl: './terminal-panel.component.html',
  styleUrls: ['./terminal-panel.component.scss'],
})
export class TerminalPanelComponent implements AfterViewInit, OnDestroy {
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  readonly tabs = signal<TerminalTabInfo[]>([]);
  readonly activeId = signal<string | null>(null);

  @ViewChild('terminalHost', { static: true }) terminalHost!: ElementRef<HTMLDivElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly terminalWs = inject(TerminalWsService);
  private readonly authStore = inject(IdeStore.AuthStore);
  private readonly themeStore = inject(ThemeStore);
  private manager!: TerminalManager;

  constructor() {
    effect(() => {
      const isDark = this.themeStore.theme() === 'dark';
      this.manager?.setTheme(isDark);
    });
  }

  ngAfterViewInit(): void {
    this.manager = new TerminalManager();

    this.manager.setStateCallback((newTabs, newActiveId) => {
      this.tabs.set([...newTabs]);
      this.activeId.set(newActiveId);
      this.cdr.markForCheck();
      if (newTabs.length === 0) {
        this.layoutStore.closeTerminal();
      }
    });

    this.manager.setTheme(this.themeStore.theme() === 'dark');
    this.restoreSessions();
  }

  ngOnDestroy(): void {
    this.manager?.disposeAll(this.terminalWs);
  }

  onAddTab(): void {
    this.createNewSession();
  }

  onTabClick(sessionId: string): void {
    this.hideAllContainers();
    this.manager.setActive(sessionId);

    const container = this.terminalHost.nativeElement.querySelector(
      `.terminal-container[data-session-id="${sessionId}"]`,
    ) as HTMLElement | null;
    if (container) {
      this.showContainer(container);
    }
  }

  onCloseTab(event: MouseEvent, sessionId: string): void {
    event.stopPropagation();
    this.manager.closeSession(sessionId, this.terminalWs);
  }

  onResizeStart(event: MouseEvent): void {
    this.manager.startResize(
      event,
      this.layoutStore.terminalHeight(),
      (h) => this.layoutStore.setTerminalHeight(h),
      this.terminalWs,
    );
  }

  private async restoreSessions(): Promise<void> {
    const count = this.manager.getSavedTabCount();
    for (let i = 0; i < count; i++) {
      await this.createNewSession();
    }
  }

  private async createNewSession(): Promise<void> {
    const cwd = this.authStore.workspace()?.rootPath;
    if (!cwd) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-container';
    this.hideAllContainers();
    wrapper.style.display = 'block';
    wrapper.style.height = '100%';
    this.terminalHost.nativeElement.appendChild(wrapper);

    const sessionId = await this.manager.createSession(wrapper, this.terminalWs, cwd);
    if (sessionId) {
      wrapper.dataset['sessionId'] = sessionId;
    }
  }

  private hideAllContainers(): void {
    this.terminalHost.nativeElement
      .querySelectorAll('.terminal-container')
      .forEach((el) => ((el as HTMLElement).style.display = 'none'));
  }

  private showContainer(el: HTMLElement): void {
    this.hideAllContainers();
    el.style.display = 'block';
    el.style.height = '100%';
  }
}
