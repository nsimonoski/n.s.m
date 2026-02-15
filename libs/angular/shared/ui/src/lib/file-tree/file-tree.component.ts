import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileTreeNodeComponent } from './node/file-tree-node.component';
import { FileTreeCreateNodeComponent } from './create-node/file-tree-create-node.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import {
  ContextMenuAction,
  ContextMenuActionEvent,
  ContextMenuEvent,
  ContextMenuState,
  InlineCreateEvent,
  InlineRenameEvent,
  ResizeState,
} from '../context-menu/context-menu.dto';
import { FileTreeStore } from './file-tree.store';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [FileTreeNodeComponent, FileTreeCreateNodeComponent, ContextMenuComponent],
  providers: [FileTreeStore],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent {
  rootDirectory = input.required<DirectoryResponseDto>();

  readonly store = inject(FileTreeStore);

  // Resizing
  width = signal(300);
  private resize = signal<ResizeState>({ isResizing: false, startX: 0, startWidth: 0 });

  renamingPath = signal<string | null>(null);

  handleRename = output<InlineRenameEvent>();
  handleDelete = output<DirectoryResponseDto | FileResponseDto | null>();
  handleOpen = output<DirectoryResponseDto | FileResponseDto | null>();
  handleExpand = output<DirectoryResponseDto>();
  handleInlineCreate = output<InlineCreateEvent>();

  contextMenu = signal<ContextMenuState>({ visible: false, x: 0, y: 0, node: null });

  rootNodes = computed(() => {
    const root = this.rootDirectory();
    return [...root.directories, ...root.files];
  });

  rootInlineCreateActive = computed(() => {
    const root = this.rootDirectory();
    return !!this.store.inlineCreateFor()(root.path);
  });

  onNodeClicked(node: DirectoryResponseDto | FileResponseDto): void {
    this.store.selectNode(node.path);

    if (node.type !== Enums.FileType.DIRECTORY) {
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

  onContextMenu(event: ContextMenuEvent): void {
    event.mouseEvent.preventDefault();
    this.contextMenu.set({
      visible: true,
      x: event.mouseEvent.clientX,
      y: event.mouseEvent.clientY,
      node: event.node,
    });
  }

  onContextMenuAction(event: ContextMenuActionEvent): void {
    this.closeContextMenu();

    switch (event.action) {
      case ContextMenuAction.NEW_FILE:
        this.startInlineCreate(event.node, 'file');
        break;
      case ContextMenuAction.NEW_FOLDER:
        this.startInlineCreate(event.node, 'directory');
        break;
      case ContextMenuAction.RENAME:
        this.renamingPath.set(event.node?.path ?? null);
        break;
      case ContextMenuAction.DELETE:
        this.handleDelete.emit(event.node);
        break;
      case ContextMenuAction.OPEN:
        this.handleOpen.emit(event.node);
        break;
    }
  }

  onRenameConfirmed(event: InlineRenameEvent): void {
    this.handleRename.emit(event);
    this.renamingPath.set(null);
  }

  onRenameCancelled(): void {
    this.renamingPath.set(null);
  }

  closeContextMenu(): void {
    this.contextMenu.update((state) => ({ ...state, visible: false }));
  }

  onResizeStart(event: MouseEvent): void {
    this.resize.set({ isResizing: true, startX: event.clientX, startWidth: this.width() });

    event.preventDefault();

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private startInlineCreate(
    node: DirectoryResponseDto | FileResponseDto | null,
    type: 'file' | 'directory',
  ): void {
    let parentPath: string;

    if (!node) {
      parentPath = this.rootDirectory().path;
    } else if (node.type === Enums.FileType.DIRECTORY) {
      parentPath = node.path;
    } else {
      parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
    }

    this.store.startInlineCreate(parentPath, type);
  }

  private onResize = (event: MouseEvent): void => {
    const r = this.resize();
    if (!r.isResizing) return;

    const delta = event.clientX - r.startX;
    const newWidth = r.startWidth + delta;

    this.width.set(Math.min(Math.max(newWidth, 200), 600));
  };

  private onResizeEnd = (): void => {
    this.resize.update((state) => ({ ...state, isResizing: false }));

    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };
}
