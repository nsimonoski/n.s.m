import { Component, inject, viewChild } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { IdeStore } from '@org/angular-data-access';
import {
  ConfirmationDialogComponent,
  ContextMenuActionEvent,
  ContextMenuComponent,
  FileTreeComponent,
} from '@org/angular/ui';

@Component({
  selector: 'ide-file-explorer',
  standalone: true,
  imports: [FileTreeComponent, ConfirmationDialogComponent, ContextMenuComponent],
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent {
  readonly store = inject(IdeStore.FileExplorerStore);
  readonly fileTree = viewChild.required(FileTreeComponent);

  onExpandToggled(node: DirectoryResponseDto): void {
    this.store.toggleExpanded(node.path);
  }

  onNodeSelected(node: DirectoryResponseDto | FileResponseDto): void {
    this.store.selectNode(node.path);
  }

  handleInlineCreate(event: ContextMenu.InlineCreateEvent): void {
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

  getMenuItems(node: DirectoryResponseDto | FileResponseDto | null): ContextMenu.Item[] {
    if (!node) {
      return [ContextMenu.ITEMS.NEW_FILE, ContextMenu.ITEMS.NEW_FOLDER];
    }

    if (node.type === Enums.FileType.DIRECTORY) {
      return [
        ContextMenu.ITEMS.NEW_FILE,
        ContextMenu.ITEMS.NEW_FOLDER,
        ContextMenu.ITEMS.SEPARATOR,
        ContextMenu.ITEMS.RENAME,
        ContextMenu.ITEMS.DELETE,
      ];
    }

    return [
      ContextMenu.ITEMS.OPEN,
      ContextMenu.ITEMS.SEPARATOR,
      ContextMenu.ITEMS.RENAME,
      ContextMenu.ITEMS.DELETE,
    ];
  }

  onContextMenuAction(event: ContextMenuActionEvent): void {
    switch (event.action) {
      case ContextMenu.Action.NEW_FILE:
        this.fileTree().startInlineCreate(event.node, 'file');
        break;
      case ContextMenu.Action.NEW_FOLDER:
        this.fileTree().startInlineCreate(event.node, 'directory');
        break;
      case ContextMenu.Action.RENAME:
        if (event.node) {
          this.fileTree().startRename(event.node);
        }
        break;
      case ContextMenu.Action.DELETE:
        this.handleDelete(event.node);
        break;
      case ContextMenu.Action.OPEN:
        if (event.node) this.store.navigateToFile(event.node.path);
        break;
    }
  }
}
