import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { TerminalSessionStore } from './terminal-session.store';
import { ThemeStore } from '@org/angular/ui';
@Component({
  selector: 'ide-terminal-panel',
  standalone: true,
  templateUrl: './terminal-panel.component.html',
  styleUrls: ['./terminal-panel.component.scss'],
})
export class TerminalPanelComponent implements AfterViewInit, OnDestroy {
  readonly store = inject(TerminalSessionStore);
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);

  @ViewChild('terminalHost', { static: true }) terminalHost!: ElementRef<HTMLDivElement>;

  private readonly themeStore = inject(ThemeStore);

  constructor() {
    effect(() => {
      const isDark = this.themeStore.theme() === 'dark';
      this.store.setTheme(isDark);
    });
  }

  ngAfterViewInit(): void {
    this.store.init(this.terminalHost.nativeElement);
  }

  ngOnDestroy(): void {
    this.store.dispose();
  }

  onAddTab(): void {
    this.store.createSession();
  }

  onTabClick(sessionId: string): void {
    this.store.setActive(sessionId);
  }

  onCloseTab(event: MouseEvent, sessionId: string): void {
    event.stopPropagation();
    this.store.closeSession(sessionId);
  }

  onResizeStart(event: MouseEvent): void {
    this.store.startResize(event, this.layoutStore.terminalHeight(), (h) =>
      this.layoutStore.setTerminalHeight(h),
    );
  }
}
