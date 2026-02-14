import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, FileType } from '@org/shared/contracts';
import { FileTreeNodeComponent } from './node/file-tree-node.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ContextMenuAction } from '../context-menu/context-menu.dto';
import { FileTreeStore } from './file-tree.store';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [FileTreeNodeComponent, ContextMenuComponent],
  providers: [FileTreeStore],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent {
  rootDirectory = input.required<DirectoryResponseDto>();

  readonly store = inject(FileTreeStore);

  // Resizing
  width = signal(300); // Default width in pixels'
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;

  handleNewFile = output<DirectoryResponseDto | FileResponseDto | null>();
  handleNewFolder = output<DirectoryResponseDto | FileResponseDto | null>();
  handleRename = output<DirectoryResponseDto | FileResponseDto | null>();
  handleDelete = output<DirectoryResponseDto | FileResponseDto | null>();
  handleOpen = output<DirectoryResponseDto | FileResponseDto | null>();
  handleExpand = output<DirectoryResponseDto>();

  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuNode: DirectoryResponseDto | FileResponseDto | null = null;

  rootNodes = computed(() => {
    const root = this.rootDirectory();
    return [...root.directories, ...root.files];
  });

  onNodeClicked(node: DirectoryResponseDto | FileResponseDto): void {
    this.store.selectNode(node.path);

    if (node.type !== FileType.DIRECTORY) {
      this.handleOpen.emit(node);
    }
  }

  onToggleExpand(node: DirectoryResponseDto): void {
    const wasExpanded = this.store.isExpanded()(node.path);
    this.store.toggleExpanded(node.path);

    if (!wasExpanded && node.files.length === 0 && node.directories.length === 0) {
      this.handleExpand.emit(node);
    }
  }

  onContextMenu(event: {
    mouseEvent: MouseEvent;
    node: DirectoryResponseDto | FileResponseDto | null;
  }): void {
    event.mouseEvent.preventDefault();
    this.contextMenuVisible = true;
    this.contextMenuX = event.mouseEvent.clientX;
    this.contextMenuY = event.mouseEvent.clientY;
    this.contextMenuNode = event.node;
  }

  onContextMenuAction(event: {
    action: ContextMenuAction;
    node: DirectoryResponseDto | FileResponseDto | null;
  }): void {
    this.closeContextMenu();

    switch (event.action) {
      case ContextMenuAction.NEW_FILE:
        this.handleNewFile.emit(event.node);
        break;
      case ContextMenuAction.NEW_FOLDER:
        this.handleNewFolder.emit(event.node);
        break;
      case ContextMenuAction.RENAME:
        this.handleRename.emit(event.node);
        break;
      case ContextMenuAction.DELETE:
        this.handleDelete.emit(event.node);
        break;
      case ContextMenuAction.OPEN:
        this.handleOpen.emit(event.node);
        break;
    }
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  // Resize handlers
  onResizeStart(event: MouseEvent): void {
    this.isResizing = true;
    this.startX = event.clientX;
    this.startWidth = this.width();

    event.preventDefault();

    // Add global event listeners
    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private onResize = (event: MouseEvent): void => {
    if (!this.isResizing) return;

    const delta = event.clientX - this.startX;
    const newWidth = this.startWidth + delta;

    // Min width: 200px, Max width: 600px
    this.width.set(Math.min(Math.max(newWidth, 200), 600));
  };

  private onResizeEnd = (): void => {
    this.isResizing = false;

    // Remove global event listeners
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
