import { Component, inject, viewChild } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { AngularFileExplorerStore } from './angular-file-exporer.store';
import {
  ConfirmationDialogComponent,
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuComponent,
  ContextMenuItem,
  CONTEXT_MENU_ITEMS,
  FileTreeComponent,
  InlineCreateEvent,
  InlineRenameEvent,
} from '@org/angular/ui';

@Component({
  selector: 'app-angular-file-explorer',
  standalone: true,
  imports: [FileTreeComponent, ConfirmationDialogComponent, ContextMenuComponent],
  templateUrl: './angular-file-explorer.component.html',
  styleUrls: ['./angular-file-explorer.component.scss'],
  providers: [AngularFileExplorerStore],
})
export class AngularFileExplorerComponent {
  readonly store = inject(AngularFileExplorerStore);
  readonly fileTree = viewChild.required(FileTreeComponent);

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

  getMenuItems(node: DirectoryResponseDto | FileResponseDto | null): ContextMenuItem[] {
    if (!node) {
      return [CONTEXT_MENU_ITEMS.NEW_FILE, CONTEXT_MENU_ITEMS.NEW_FOLDER];
    }

    if (node.type === Enums.FileType.DIRECTORY) {
      return [
        CONTEXT_MENU_ITEMS.NEW_FILE,
        CONTEXT_MENU_ITEMS.NEW_FOLDER,
        CONTEXT_MENU_ITEMS.SEPARATOR,
        CONTEXT_MENU_ITEMS.RENAME,
        CONTEXT_MENU_ITEMS.DELETE,
      ];
    }

    return [
      CONTEXT_MENU_ITEMS.OPEN,
      CONTEXT_MENU_ITEMS.SEPARATOR,
      CONTEXT_MENU_ITEMS.RENAME,
      CONTEXT_MENU_ITEMS.DELETE,
    ];
  }

  onContextMenuAction(event: ContextMenuActionEvent): void {
    switch (event.action) {
      case ContextMenuAction.NEW_FILE:
        this.fileTree().startInlineCreate(event.node, 'file');
        break;
      case ContextMenuAction.NEW_FOLDER:
        this.fileTree().startInlineCreate(event.node, 'directory');
        break;
      case ContextMenuAction.RENAME:
        this.fileTree().renamingPath.set(event.node?.path ?? null);
        break;
      case ContextMenuAction.DELETE:
        this.handleDelete(event.node);
        break;
      case ContextMenuAction.OPEN:
        this.handleOpen(event.node);
        break;
    }
  }
}
