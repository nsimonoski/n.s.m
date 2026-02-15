import { Component, inject } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';
import { AngularFileExplorerStore } from './angular-file-exporer.store';
import { Enums } from '@org/shared/contracts';
import {
  ConfirmationDialogComponent,
  FileTreeComponent,
  InlineCreateEvent,
  InlineRenameEvent,
} from '@org/angular/ui';

@Component({
  selector: 'app-angular-file-explorer',
  standalone: true,
  imports: [FileTreeComponent, ConfirmationDialogComponent],
  templateUrl: './angular-file-explorer.component.html',
  styleUrls: ['./angular-file-explorer.component.scss'],
  providers: [AngularFileExplorerStore],
})
export class AngularFileExplorerComponent {
  readonly store = inject(AngularFileExplorerStore);

  handleInlineCreate(event: InlineCreateEvent): void {
    const fullPath = `${event.parentPath}/${event.name}`;

    if (event.type === Enums.FileType.DIRECTORY) {
      this.store.createDirectory(fullPath);
      return;
    }

    this.store.createFile(fullPath);
  }

  handleRename(event: InlineRenameEvent): void {
    this.store.rename({ path: event.node.path, newName: event.newName });
  }

  handleDelete(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) {
      return;
    }

    this.store.openDialog(
      `Delete ${node.type}`,
      `Are you sure you want to delete ${node.name}`,
      node.path,
    );
  }

  onConfirmDelete(): void {
    this.store.delete(this.store.dialogData() as string);
    this.store.closeDialog();
  }

  handleOpen(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) {
      return;
    }

    this.store.getFile(node.path);
  }

  handleExpandDirectory(node: DirectoryResponseDto): void {
    this.store.expandDirectory(node.path);
  }
}
