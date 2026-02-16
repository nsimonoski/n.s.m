import { Component, inject } from '@angular/core';
import { FileExplorerComponent } from '@org/angular-file-explorer';
import { FileExplorerGitComponent } from '@org/angular-file-explorer-git';
import { ActivityBarComponent } from './activity-bar/activity-bar.component';
import { FooterComponent } from './footer/footer.component';
import { FileExplorerCoreStore } from './file-explorer-core.store';

@Component({
  selector: 'ide-file-explorer-core',
  standalone: true,
  imports: [ActivityBarComponent, FooterComponent, FileExplorerComponent, FileExplorerGitComponent],
  templateUrl: './file-explorer-core.component.html',
  styleUrls: ['./file-explorer-core.component.scss'],
})
export class FileExplorerCoreComponent {
  readonly coreStore = inject(FileExplorerCoreStore);

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
