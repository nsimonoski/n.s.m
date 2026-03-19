import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { FileUtils, GitTreeUtils } from '@org/shared/utils';
import {
  CollapsibleSectionComponent,
  ConfirmationDialogComponent,
  ContextMenuActionEvent,
  ContextMenuComponent,
  DropdownMenuComponent,
  DropdownMenuItem,
  FileTreeComponent,
  FileTreeNodeActionComponent,
  NodeAction,
} from '@org/angular/ui';
import { GitChangesStore } from './git-changes.store';
import { GitCommitStore } from './git-commit.store';
import { GitSyncComponent } from './git-sync/git-sync.component';
import { CommitHistoryComponent } from './commit-history/commit-history.component';

enum HeaderAction {
  Stash = 'stash',
  StashAll = 'stash-all',
  StashPop = 'stash-pop',
  StashApply = 'stash-apply',
}

const STAGED_ACTIONS: NodeAction[] = [
  { id: ContextMenu.Action.UNSTAGE, icon: 'codicon-dash', tooltip: 'Unstage Changes' },
];

const CHANGES_ACTIONS: NodeAction[] = [
  { id: ContextMenu.Action.STAGE, icon: 'codicon-add', tooltip: 'Stage Changes' },
  { id: ContextMenu.Action.DISCARD, icon: 'codicon-discard', tooltip: 'Discard Changes' },
];

@Component({
  selector: 'ide-git-panel',
  standalone: true,
  imports: [
    FileTreeComponent,
    FileTreeNodeActionComponent,
    ContextMenuComponent,
    ConfirmationDialogComponent,
    DropdownMenuComponent,
    GitSyncComponent,
    CollapsibleSectionComponent,
    CommitHistoryComponent,
  ],
  providers: [GitChangesStore, GitCommitStore],
  templateUrl: './git-panel.component.html',
  styleUrls: ['./git-panel.component.scss'],
})
export class GitPanelComponent {
  readonly changesStore = inject(GitChangesStore);
  readonly commitStore = inject(GitCommitStore);
  readonly fileTreeComponent = viewChild(FileTreeComponent);

  readonly headerMenuItems: DropdownMenuItem[] = [
    {
      id: HeaderAction.Stash,
      label: 'Stash',
      children: [
        { id: HeaderAction.StashAll, label: 'Stash All Changes' },
        { id: HeaderAction.StashPop, label: 'Pop Stash' },
        { id: HeaderAction.StashApply, label: 'Apply Stash' },
      ],
    },
  ];

  discardDialogOpen = signal(false);
  private pendingDiscardPaths: string[] = [];

  constructor() {
    effect(() => {
      const changes = this.changesStore.changesTree();
      const fileTree = this.fileTreeComponent();
      if (!changes || !fileTree) {
        return;
      }
      untracked(() => fileTree.expandPaths(FileUtils.collectDirectoryPaths(changes)));
    });
  }

  getNodeActions(node: DirectoryResponseDto | FileResponseDto): NodeAction[] {
    if (node.path.startsWith('/staged')) return STAGED_ACTIONS;
    if (node.path.startsWith('/changes')) return CHANGES_ACTIONS;
    return [];
  }

  getMenuItems(node: DirectoryResponseDto | FileResponseDto | null): ContextMenu.Item[] {
    if (!node) {
      return [];
    }

    return [
      ContextMenu.GIT_ITEMS.STAGE,
      ContextMenu.GIT_ITEMS.UNSTAGE,
      ContextMenu.GIT_ITEMS.SEPARATOR,
      ContextMenu.GIT_ITEMS.DISCARD,
      ContextMenu.GIT_ITEMS.SEPARATOR,
      ContextMenu.GIT_ITEMS.OPEN,
    ];
  }

  onFileClick(node: DirectoryResponseDto | FileResponseDto | null): void {
    if (node && node.type !== Enums.FileType.DIRECTORY) {
      this.changesStore.openDiff(GitTreeUtils.stripGitSectionPrefix(node.path));
    }
  }

  onContextMenuAction(event: ContextMenuActionEvent): void {
    if (!event.node) return;
    this.handleAction(event.action, event.node);
  }

  onNodeAction(actionId: string, node: DirectoryResponseDto | FileResponseDto): void {
    this.handleAction(actionId as ContextMenu.Action, node);
  }

  onDiscardConfirmed(): void {
    this.changesStore.discard(this.pendingDiscardPaths);
    this.closeDiscardDialog();
  }

  onHeaderAction(id: string): void {
    switch (id) {
      case HeaderAction.StashAll:
        this.changesStore.stash();
        break;
      case HeaderAction.StashPop:
        this.changesStore.stashPop();
        break;
      case HeaderAction.StashApply:
        this.changesStore.stashApply();
        break;
    }
  }

  closeDiscardDialog(): void {
    this.discardDialogOpen.set(false);
    this.pendingDiscardPaths = [];
  }

  private handleAction(
    action: ContextMenu.Action,
    node: DirectoryResponseDto | FileResponseDto,
  ): void {
    const paths = this.getFilePaths(node);

    switch (action) {
      case ContextMenu.Action.STAGE:
        this.changesStore.stage(paths);
        break;
      case ContextMenu.Action.UNSTAGE:
        this.changesStore.unstage(paths);
        break;
      case ContextMenu.Action.DISCARD:
        this.pendingDiscardPaths = paths;
        this.discardDialogOpen.set(true);
        break;
      case ContextMenu.Action.OPEN:
        if (node.type !== Enums.FileType.DIRECTORY) {
          this.changesStore.openDiff(GitTreeUtils.stripGitSectionPrefix(node.path));
        }
        break;
    }
  }

  private getFilePaths(node: DirectoryResponseDto | FileResponseDto): string[] {
    if (node.type !== Enums.FileType.DIRECTORY) {
      return [GitTreeUtils.stripGitSectionPrefix(node.path)];
    }
    const dir = node as DirectoryResponseDto;
    return [
      ...dir.files.map((f) => GitTreeUtils.stripGitSectionPrefix(f.path)),
      ...dir.directories.flatMap((d) => this.getFilePaths(d)),
    ];
  }
}
