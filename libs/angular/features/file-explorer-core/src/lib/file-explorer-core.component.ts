import { Component, inject, signal } from '@angular/core';
import { FileResponseDto } from '@org/shared/contracts';
import { FileExplorerComponent } from '@org/angular-file-explorer';
import { FileExplorerGitComponent } from '@org/angular-file-explorer-git';
import { FilePickerComponent } from './file-picker/file-picker.component';
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
    FilePickerComponent,
  ],
  templateUrl: './file-explorer-core.component.html',
  styleUrls: ['./file-explorer-core.component.scss'],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class FileExplorerCoreComponent {
  readonly coreStore = inject(FileExplorerCoreStore);
  readonly showFilePicker = signal(false);
  readonly fileToOpen = signal<FileResponseDto | null>(null);

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
    this.showFilePicker.set(false);
    this.coreStore.setActivePanel('explorer');
    this.fileToOpen.set(file);
  }

  onFilePickerClosed(): void {
    this.showFilePicker.set(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 't') {
      event.preventDefault();
      this.showFilePicker.update((v) => !v);
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
