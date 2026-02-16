import {
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileTreeNodeComponent } from './node/file-tree-node.component';
import { FileTreeCreateNodeComponent } from './create-node/file-tree-create-node.component';
import {
  ContextMenuEvent,
  ContextMenuState,
  ContextMenuTemplateContext,
  InlineCreateEvent,
  InlineRenameEvent,
} from '../context-menu/context-menu.dto';
import { FileTreeStore } from './file-tree.store';

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [FileTreeNodeComponent, FileTreeCreateNodeComponent, NgTemplateOutlet],
  providers: [FileTreeStore],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent {
  rootDirectory = input.required<DirectoryResponseDto>();
  statusMap = input<Record<string, string>>({});
  contextMenuTpl = contentChild.required<TemplateRef<ContextMenuTemplateContext>>('contextMenu');

  readonly store = inject(FileTreeStore);

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

  startInlineCreate(
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
}
