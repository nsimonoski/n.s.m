import { Component, inject, signal } from '@angular/core';
import { FileResponseDto } from '@org/shared/contracts';
import { FileExplorerComponent, FileExplorerStore } from '@org/angular-file-explorer';
import { FileExplorerGitComponent } from '@org/angular-file-explorer-git';
import { GoToFileComponent } from '@org/angular/ui';
import { ActivityBarComponent } from './activity-bar/activity-bar.component';
import { FooterComponent } from './footer/footer.component';
import { FileExplorerCoreStore } from './file-explorer-core.store';

@Component({
  selector: 'ide-file-explorer-core',
  standalone: true,
  imports: [
    ActivityBarComponent,
    FooterComponent,
    FileExplorerComponent,
    FileExplorerGitComponent,
    GoToFileComponent,
  ],
  templateUrl: './file-explorer-core.component.html',
  styleUrls: ['./file-explorer-core.component.scss'],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class FileExplorerCoreComponent {
  readonly coreStore = inject(FileExplorerCoreStore);
  readonly showGoToFile = signal(false);

  private readonly fileExplorerStore = inject(FileExplorerStore);
  private resizing = false;
  private startX = 0;
  private startWidth = 0;

  onResizeStart(event: MouseEvent): void {
    this.resizing = true;
    this.startX = event.clientX;
    this.startWidth = this.coreStore.width();
    event.preventDefault();

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onFileSelected(file: FileResponseDto): void {
    this.showGoToFile.set(false);
    this.coreStore.setActivePanel('explorer');
    this.fileExplorerStore.getFile(file.path);
    this.fileExplorerStore.revealFile(file.path);
  }

  onGoToFileClosed(): void {
    this.showGoToFile.set(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      this.showGoToFile.update((v) => !v);
    }
  }

  private onResize = (event: MouseEvent): void => {
    if (!this.resizing) return;
    const delta = event.clientX - this.startX;
    const newWidth = Math.min(Math.max(this.startWidth + delta, 200), 600);
    this.coreStore.setWidth(newWidth);
  };

  private onResizeEnd = (): void => {
    this.resizing = false;
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
