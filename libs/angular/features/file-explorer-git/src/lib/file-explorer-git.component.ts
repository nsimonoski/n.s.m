import { Component, inject, signal } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import {
  ConfirmationDialogComponent,
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuComponent,
  ContextMenuItem,
  FileTreeComponent,
  FileTreeNodeActionComponent,
  GIT_CONTEXT_MENU_ITEMS,
  NodeAction,
} from '@org/angular/ui';
import { FileExplorerGitStore } from './file-explorer-git.store';
import { FileExplorerGitSyncComponent } from './commit-input/file-explorer-git-sync.component';

const STAGED_ACTIONS: NodeAction[] = [
  { id: ContextMenuAction.UNSTAGE, icon: 'codicon-dash', tooltip: 'Unstage Changes' },
];

const CHANGES_ACTIONS: NodeAction[] = [
  { id: ContextMenuAction.STAGE, icon: 'codicon-add', tooltip: 'Stage Changes' },
  { id: ContextMenuAction.DISCARD, icon: 'codicon-discard', tooltip: 'Discard Changes' },
];

@Component({
  selector: 'ide-file-explorer-git',
  standalone: true,
  imports: [
    FileTreeComponent,
    FileTreeNodeActionComponent,
    ContextMenuComponent,
    ConfirmationDialogComponent,
    FileExplorerGitSyncComponent,
  ],
  templateUrl: './file-explorer-git.component.html',
  styleUrls: ['./file-explorer-git.component.scss'],
})
export class FileExplorerGitComponent {
  readonly store = inject(FileExplorerGitStore);

  discardDialogOpen = signal(false);
  private pendingDiscardPaths: string[] = [];

  getNodeActions(node: DirectoryResponseDto | FileResponseDto): NodeAction[] {
    if (node.path.startsWith('/staged')) return STAGED_ACTIONS;
    if (node.path.startsWith('/changes')) return CHANGES_ACTIONS;
    return [];
  }

  getMenuItems(node: DirectoryResponseDto | FileResponseDto | null): ContextMenuItem[] {
    if (!node) {
      return [];
    }

    return [
      GIT_CONTEXT_MENU_ITEMS.STAGE,
      GIT_CONTEXT_MENU_ITEMS.UNSTAGE,
      GIT_CONTEXT_MENU_ITEMS.SEPARATOR,
      GIT_CONTEXT_MENU_ITEMS.DISCARD,
      GIT_CONTEXT_MENU_ITEMS.SEPARATOR,
      GIT_CONTEXT_MENU_ITEMS.OPEN,
    ];
  }

  onFileClick(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (node && node.type !== Enums.FileType.DIRECTORY) {
      this.store.openDiff(node.path);
    }
  }

  onContextMenuAction(event: ContextMenuActionEvent): void {
    if (!event.node) return;
    this.handleAction(event.action, event.node);
  }

  onNodeAction(actionId: string, node: DirectoryResponseDto | FileResponseDto): void {
    this.handleAction(actionId as ContextMenuAction, node);
  }

  private handleAction(
    action: ContextMenuAction,
    node: DirectoryResponseDto | FileResponseDto,
  ): void {
    const paths = this.getFilePaths(node);

    switch (action) {
      case ContextMenuAction.STAGE:
        this.store.stage(paths);
        break;
      case ContextMenuAction.UNSTAGE:
        this.store.unstage(paths);
        break;
      case ContextMenuAction.DISCARD:
        this.pendingDiscardPaths = paths;
        this.discardDialogOpen.set(true);
        break;
      case ContextMenuAction.OPEN:
        if (node.type !== Enums.FileType.DIRECTORY) {
          this.store.openDiff(node.path);
        }
        break;
    }
  }

  onDiscardConfirmed(): void {
    this.store.discard(this.pendingDiscardPaths);
    this.closeDiscardDialog();
  }

  closeDiscardDialog(): void {
    this.discardDialogOpen.set(false);
    this.pendingDiscardPaths = [];
  }

  private getFilePaths(node: DirectoryResponseDto | FileResponseDto): string[] {
    if (node.type !== Enums.FileType.DIRECTORY) {
      return [node.path];
    }
    const dir = node as DirectoryResponseDto;
    return [
      ...dir.files.map((f) => f.path),
      ...dir.directories.flatMap((d) => this.getFilePaths(d)),
    ];
  }
}
