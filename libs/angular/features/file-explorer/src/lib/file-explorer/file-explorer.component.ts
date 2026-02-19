import { Component, effect, inject, input, viewChild } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileExplorerStore } from './file-explorer.store';
import {
  ConfirmationDialogComponent,
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuComponent,
  ContextMenuItem,
  CONTEXT_MENU_ITEMS,
  FileTreeComponent,
  InlineCreateEvent,
} from '@org/angular/ui';

@Component({
  selector: 'ide-file-explorer',
  standalone: true,
  imports: [FileTreeComponent, ConfirmationDialogComponent, ContextMenuComponent],
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent {
  readonly store = inject(FileExplorerStore);
  readonly fileTree = viewChild.required(FileTreeComponent);
  readonly fileToOpen = input<FileResponseDto | null>(null);

  constructor() {
    effect(() => {
      const file = this.fileToOpen();
      if (file) {
        this.store.getFile(file.path);
        this.store.revealFile(file.path);
      }
    });
  }

  onExpandToggled(node: DirectoryResponseDto): void {
    this.store.toggleExpanded(node.path);
  }

  onNodeSelected(node: DirectoryResponseDto | FileResponseDto): void {
    this.store.selectNode(node.path);
  }

  handleInlineCreate(event: InlineCreateEvent): void {
    const fullPath = `${event.parentPath}/${event.name}`;

    if (event.type === Enums.FileType.DIRECTORY) {
      this.store.createDirectory(fullPath);
      return;
    }

    this.store.createFile(fullPath);
  }

  handleDelete(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (!node) return;

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
        if (event.node) {
          this.fileTree().startRename(event.node);
        }
        break;
      case ContextMenuAction.DELETE:
        this.handleDelete(event.node);
        break;
      case ContextMenuAction.OPEN:
        if (event.node) this.store.getFile(event.node.path);
        break;
    }
  }
}
