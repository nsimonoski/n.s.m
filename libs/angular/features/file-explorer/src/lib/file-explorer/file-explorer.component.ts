import { Component, effect, inject, viewChild, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';

import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { IdeStore } from '@org/angular-data-access';
import {
  ConfirmationDialogComponent,
  ContextMenuActionEvent,
  ContextMenuComponent,
  FileTreeComponent,
  FileTreeCreateNodeComponent,
} from '@org/angular/ui';

@Component({
  selector: 'ide-file-explorer',
  standalone: true,
  imports: [
    FileTreeComponent,
    FileTreeCreateNodeComponent,
    ConfirmationDialogComponent,
    ContextMenuComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
})
export class FileExplorerComponent {
  readonly store = inject(IdeStore.FileExplorerStore);
  readonly fileTree = viewChild.required(FileTreeComponent);
  readonly inlineCreate = signal<ContextMenu.InlineCreate | null>(null);

  private readonly revealFilePath = toSignal(
    this.store.navigationEnd$.pipe(
      map((event) =>
        new URL(event.urlAfterRedirects, location.origin).searchParams.get('filePath'),
      ),
      filter((filePath): filePath is string => !!filePath),
      distinctUntilChanged(),
    ),
  );

  constructor() {
    effect(async () => {
      const filePath = this.revealFilePath();
      if (!filePath) return;

      const result = await this.store.revealFile(filePath);
      if (!result) return;

      this.fileTree().expandPaths(result.ancestors);
      this.fileTree().selectNode(result.filePath);
    });
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
        this.inlineCreate.set(
          ContextMenu.startInlineCreate(event.node, 'file', this.store.directory()!.path),
        );
        break;
      case ContextMenu.Action.NEW_FOLDER:
        this.inlineCreate.set(
          ContextMenu.startInlineCreate(event.node, 'directory', this.store.directory()!.path),
        );
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
