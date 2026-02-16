import { Component, effect, inject, viewChild } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import {
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuComponent,
  ContextMenuItem,
  FileTreeComponent,
  GIT_CONTEXT_MENU_ITEMS,
} from '@org/angular/ui';
import { AngularFileExplorerGitStore } from './angular-file-explorer-git.store';
import { AngularFileExplorerGitSyncComponent } from './commit-input/angular-file-explorer-git-sync.component';

@Component({
  selector: 'app-angular-file-explorer-git',
  standalone: true,
  imports: [FileTreeComponent, ContextMenuComponent, AngularFileExplorerGitSyncComponent],
  templateUrl: './angular-file-explorer-git.component.html',
  styleUrls: ['./angular-file-explorer-git.component.scss'],
  providers: [AngularFileExplorerGitStore],
})
export class AngularFileExplorerGitComponent {
  readonly store = inject(AngularFileExplorerGitStore);
  private readonly fileTree = viewChild(FileTreeComponent);

  constructor() {
    effect(() => {
      const tree = this.store.changesTree();
      const fileTree = this.fileTree();
      if (tree && fileTree) {
        fileTree.store.expandAll(this.getAllDirectoryPaths(tree));
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

    const paths = this.getFilePaths(event.node);

    switch (event.action) {
      case ContextMenuAction.STAGE:
        this.store.stage(paths);
        break;
      case ContextMenuAction.UNSTAGE:
        this.store.unstage(paths);
        break;
      case ContextMenuAction.DISCARD:
        // TODO: implement discard
        break;
      case ContextMenuAction.OPEN:
        // TODO: open file diff
        break;
    }
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
