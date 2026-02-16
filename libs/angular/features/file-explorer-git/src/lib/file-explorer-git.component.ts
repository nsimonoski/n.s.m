import { Component, computed, effect, inject, signal, viewChildren } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import {
  ConfirmationDialogComponent,
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuComponent,
  ContextMenuItem,
  FileTreeComponent,
  GIT_CONTEXT_MENU_ITEMS,
  NodeAction,
} from '@org/angular/ui';
import { FileExplorerGitStore } from './file-explorer-git.store';
import { FileExplorerGitSyncComponent } from './commit-input/file-explorer-git-sync.component';

@Component({
  selector: 'ide-file-explorer-git',
  standalone: true,
  imports: [FileTreeComponent, ContextMenuComponent, ConfirmationDialogComponent, FileExplorerGitSyncComponent],
  templateUrl: './file-explorer-git.component.html',
  styleUrls: ['./file-explorer-git.component.scss'],
  providers: [FileExplorerGitStore],
})
export class FileExplorerGitComponent {
  readonly store = inject(FileExplorerGitStore);
  private readonly fileTrees = viewChildren(FileTreeComponent);

  discardDialogOpen = signal(false);
  private pendingDiscardPaths: string[] = [];

  readonly stagedTree = computed(() => {
    const tree = this.store.changesTree();
    return tree?.directories.find((d) => d.path === '/staged') ?? null;
  });

  readonly changesTree = computed(() => {
    const tree = this.store.changesTree();
    return tree?.directories.find((d) => d.path === '/changes') ?? null;
  });

  readonly stagedNodeActions: NodeAction[] = [
    { id: ContextMenuAction.UNSTAGE, icon: 'codicon-dash', tooltip: 'Unstage Changes' },
  ];

  readonly changesNodeActions: NodeAction[] = [
    { id: ContextMenuAction.STAGE, icon: 'codicon-add', tooltip: 'Stage Changes' },
    { id: ContextMenuAction.DISCARD, icon: 'codicon-discard', tooltip: 'Discard Changes' },
  ];

  constructor() {
    effect(() => {
      const staged = this.stagedTree();
      const changes = this.changesTree();
      const trees = this.fileTrees();

      for (const fileTree of trees) {
        const root = fileTree.rootDirectory();
        if (root && (root === staged || root === changes)) {
          fileTree.store.expandAll(this.getAllDirectoryPaths(root));
        }
      }
    });
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

  onContextMenuAction(event: ContextMenuActionEvent): void {
    if (!event.node) return;
    this.handleAction(event.action, event.node);
  }

  onNodeAction(event: { actionId: string; node: DirectoryResponseDto | FileResponseDto }): void {
    this.handleAction(event.actionId as ContextMenuAction, event.node);
  }

  private handleAction(action: ContextMenuAction, node: DirectoryResponseDto | FileResponseDto): void {
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
        // TODO: open file diff
        break;
    }
  }

  onDiscardConfirmed(): void {
    this.store.discard(this.pendingDiscardPaths);
    this.discardDialogOpen.set(false);
    this.pendingDiscardPaths = [];
  }

  onDiscardCancelled(): void {
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

  private getAllDirectoryPaths(dir: DirectoryResponseDto): string[] {
    const paths = [dir.path];
    for (const child of dir.directories) {
      paths.push(...this.getAllDirectoryPaths(child));
    }
    return paths;
  }
}
