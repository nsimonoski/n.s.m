import { Component, inject } from '@angular/core';
import { AngularFileExplorerStore } from './angular-file-exporer.store';
import { FileTreeComponent } from '@org/angular/ui';
import { DirectoryResponseDto, FileResponseDto, FileType } from '@org/shared/contracts';

@Component({
  selector: 'app-angular-file-explorer',
  standalone: true,
  imports: [FileTreeComponent],
  templateUrl: './angular-file-explorer.component.html',
  styleUrls: ['./angular-file-explorer.component.scss'],
  providers: [AngularFileExplorerStore],
})
export class AngularFileExplorerComponent {
  readonly store = inject(AngularFileExplorerStore);

  handleNewFile(node: DirectoryResponseDto | FileResponseDto | null): void {
    const name = prompt('Enter file name:');
    if (!name) return;

    const parentPath = this.getParentPath(node);
    this.store.createFile(`${parentPath}/${name}`);
  }

  handleNewFolder(node: DirectoryResponseDto | FileResponseDto | null): void {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const parentPath = this.getParentPath(node);
    this.store.createDirectory(`${parentPath}/${name}`);
  }

  handleRename(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) return;

    const newName = prompt('Enter new name:', node.name);
    if (!newName || newName === node.name) return;

    this.store.rename({ file: node as FileResponseDto, newName });
  }

  handleDelete(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) return;

    const confirmed = confirm(`Delete "${node.name}"?`);
    if (!confirmed) return;

    this.store.delete(node.path);
  }

  handleOpen(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) return;

    this.store.getFile(node.path);
  }

  handleExpandDirectory(node: DirectoryResponseDto): void {
    this.store.expandDirectory(node.path);
  }

  private getParentPath(node: DirectoryResponseDto | FileResponseDto | null): string {
    if (!node) {
      return this.store.directory()?.path ?? '';
    }

    if (node.type === FileType.DIRECTORY) {
      return node.path;
    }

    return node.path.substring(0, node.path.lastIndexOf('/'));
  }
}
