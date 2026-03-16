import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileResponseDto } from '@org/shared/contracts';
import { ResizeUtils } from '@org/shared/utils';
import { FilePickerComponent } from './file-picker/file-picker.component';
import { ActivityBarComponent } from './activity-bar/activity-bar.component';
import { FooterComponent } from './footer/footer.component';
import { SnackbarComponent } from '@org/angular/ui';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    ActivityBarComponent,
    FooterComponent,
    FilePickerComponent,
    SnackbarComponent,
  ],
  templateUrl: './ide-layout.component.html',
  styleUrls: ['./ide-layout.component.scss'],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class IdeLayoutComponent {
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  readonly showFilePicker = signal(false);

  onResizeStart(event: MouseEvent): void {
    this.resizing = true;
    this.startX = event.clientX;
    this.startWidth = this.layoutStore.width();
    event.preventDefault();

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  onFileSelected(file: FileResponseDto): void {
    this.showFilePicker.set(false);
    this.layoutStore.openFile(file.path);
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
