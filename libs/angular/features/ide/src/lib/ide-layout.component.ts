import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileResponseDto } from '@org/shared/contracts';
import { ResizeUtils } from '@org/shared/utils';
import { FileSearchComponent } from './file-search/file-search.component';
import { ActivityBarComponent } from './activity-bar/activity-bar.component';
import { FooterComponent } from './footer/footer.component';
import { InstallBannerComponent, SnackbarComponent, SwipeDirective } from '@org/angular/ui';
import { IdeStore } from '@org/angular-data-access';
import { VoiceControlComponent } from '@org/angular-voice-control';

@Component({
  selector: 'ide-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ActivityBarComponent,
    FooterComponent,
    FileSearchComponent,
    SnackbarComponent,
    VoiceControlComponent,
    SwipeDirective,
    InstallBannerComponent,
  ],
  templateUrl: './ide-layout.component.html',
  styleUrls: ['./ide-layout.component.scss'],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class IdeLayoutComponent {
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  readonly showFileSearch = signal(false);

  onSwipeLeft(): void {
    const panels = ['explorer', 'git', 'ai'];
    const idx = panels.indexOf(this.layoutStore.activePanel());
    const next = panels[Math.min(idx + 1, panels.length - 1)];
    this.layoutStore.setActivePanel(next);
  }

  onSwipeRight(): void {
    const panels = ['explorer', 'git', 'ai'];
    const idx = panels.indexOf(this.layoutStore.activePanel());
    const prev = panels[Math.max(idx - 1, 0)];
    this.layoutStore.setActivePanel(prev);
  }

  onResizeStart(event: MouseEvent): void {
    this.resizing = true;
    this.startX = event.clientX;
    this.startWidth = this.layoutStore.width();
    event.preventDefault();

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onFileSelected(file: FileResponseDto): void {
    this.showFileSearch.set(false);
    this.layoutStore.openFile(file.path);
  }

  onFileSearchClosed(): void {
    this.showFileSearch.set(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      this.showFileSearch.update((v) => !v);
    }
    if ((event.ctrlKey || event.metaKey) && event.key === '`') {
      event.preventDefault();
      this.layoutStore.toggleTerminal();
    }
  }

  private resizing = false;
  private startX = 0;
  private startWidth = 0;

  private onResize = (event: MouseEvent): void => {
    if (!this.resizing) return;
    const delta = event.clientX - this.startX;
    const newWidth = ResizeUtils.clampPanelWidth(this.startWidth + delta);
    this.layoutStore.setWidth(newWidth);
  };

  private onResizeEnd = (): void => {
    this.resizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
