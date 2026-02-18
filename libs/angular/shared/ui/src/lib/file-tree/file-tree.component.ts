import {
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import {
  FileTreeCreateNodeComponent,
  InlineCreate,
} from './create-node/file-tree-create-node.component';
import {
  ContextMenuState,
  ContextMenuTemplateContext,
  InlineCreateEvent,
  InlineRenameEvent,
} from '../context-menu/context-menu.dto';
import {
  FileIconPipe,
  ExpandIconPipe,
  IndentGuidesPipe,
  FileChildrenPipe,
} from './file-tree.pipes';

@Component({
  selector: 'ui-file-tree',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FileTreeCreateNodeComponent,
    FileIconPipe,
    ExpandIconPipe,
    IndentGuidesPipe,
    FileChildrenPipe,
  ],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent {
  readonly DIRECTORY_TYPE = Enums.FileType.DIRECTORY;

  rootDirectory = input.required<DirectoryResponseDto>();
  expandedPaths = input.required<Set<string>>();
  selectedPath = input.required<string | null>();
  statusMap = input<Record<string, string>>({});
  contextMenuTpl = contentChild.required<TemplateRef<ContextMenuTemplateContext>>('contextMenu');
  nodeActionsTpl =
    contentChild<TemplateRef<{ $implicit: DirectoryResponseDto | FileResponseDto }>>('nodeActions');

  expandToggled = output<DirectoryResponseDto>();
  nodeSelected = output<DirectoryResponseDto | FileResponseDto>();
  handleExpand = output<DirectoryResponseDto>();
  handleOpen = output<DirectoryResponseDto | FileResponseDto | null>();
  handleDelete = output<DirectoryResponseDto | FileResponseDto | null>();
  handleRename = output<InlineRenameEvent>();
  handleInlineCreate = output<InlineCreateEvent>();

  readonly inlineCreate = signal<InlineCreate | null>(null);
  readonly renamingNode = signal<DirectoryResponseDto | FileResponseDto | null>(null);
  readonly contextMenu = signal<ContextMenuState>({ visible: false, x: 0, y: 0, node: null });

  renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  rootNodes = computed(() => {
    const root = this.rootDirectory();
    return [...root.directories, ...root.files];
  });

  onNodeClick(node: DirectoryResponseDto | FileResponseDto): void {
    this.nodeSelected.emit(node);

    if (node.type === Enums.FileType.DIRECTORY) {
      const dir = node as DirectoryResponseDto;
      this.expandToggled.emit(dir);

      const wasExpanded = this.expandedPaths().has(node.path);
      if (!wasExpanded && dir.files.length === 0 && dir.directories.length === 0) {
        this.handleExpand.emit(dir);
      }
    } else {
      this.handleOpen.emit(node);
    }
  }

  onContextMenu(event: MouseEvent, node: DirectoryResponseDto | FileResponseDto | null): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      node,
    });
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

    this.inlineCreate.set({ parentPath, type });
  }

  cancelInlineCreate(): void {
    this.inlineCreate.set(null);
  }

  onRenameKeydown(event: KeyboardEvent, node: DirectoryResponseDto | FileResponseDto): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      this.renamingNode.set(null);
    }
  }

  onRenameBlur(event: FocusEvent, node: DirectoryResponseDto | FileResponseDto): void {
    const newName = (event.target as HTMLInputElement).value.trim();
    if (newName && newName !== node.name) {
      this.handleRename.emit({ node, newName });
    }
    this.renamingNode.set(null);
  }

  startRename(node: DirectoryResponseDto | FileResponseDto): void {
    this.renamingNode.set(node);
    setTimeout(() => {
      const input = this.renameInput()?.nativeElement;
      if (!input) return;
      input.focus();

      const dotIndex = node.name.lastIndexOf('.');
      if (dotIndex > 0) {
        input.setSelectionRange(0, dotIndex);
      } else {
        input.select();
      }
    });
  }

  closeContextMenu = (): void => {
    this.contextMenu.update((state) => ({ ...state, visible: false }));
  };
}
