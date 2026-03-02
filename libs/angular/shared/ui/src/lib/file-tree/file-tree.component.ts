import {
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { ContextMenuState, ContextMenuTemplateContext } from '../context-menu/context-menu.dto';
import {
  FileIconPipe,
  ExpandIconPipe,
  IndentGuidesPipe,
  FileChildrenPipe,
} from './file-tree.pipes';

@Component({
  selector: 'ui-file-tree',
  standalone: true,
  imports: [NgTemplateOutlet, FileIconPipe, ExpandIconPipe, IndentGuidesPipe, FileChildrenPipe],
  templateUrl: './file-tree.component.html',
  styleUrls: ['./file-tree.component.scss'],
})
export class FileTreeComponent {
  readonly DIRECTORY_TYPE = Enums.FileType.DIRECTORY;

  rootDirectory = input.required<DirectoryResponseDto>();
  statusMap = input<Record<string, string>>({});
  contextMenuTpl = contentChild.required<TemplateRef<ContextMenuTemplateContext>>('contextMenu');
  nodeActionsTpl =
    contentChild<TemplateRef<{ $implicit: DirectoryResponseDto | FileResponseDto }>>('nodeActions');
  createNodeTpl = contentChild<TemplateRef<{ level: number; parentPath: string }>>('createNode');

  handleExpand = output<DirectoryResponseDto>();
  handleOpen = output<DirectoryResponseDto | FileResponseDto | null>();
  handleDelete = output<DirectoryResponseDto | FileResponseDto | null>();
  handleRename = output<ContextMenu.InlineRenameEvent>();

  readonly expandedPaths = signal<Set<string>>(new Set());
  readonly selectedPath = signal<string | null>(null);
  readonly renamingNode = signal<DirectoryResponseDto | FileResponseDto | null>(null);
  readonly contextMenu = signal<ContextMenuState>({ visible: false, x: 0, y: 0, node: null });

  renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  constructor() {
    effect(() => {
      this.focusRenameInputAfterRender();
    });
  }

  rootNodes = computed(() => [...this.rootDirectory().directories, ...this.rootDirectory().files]);

  onNodeClick(node: DirectoryResponseDto | FileResponseDto): void {
    this.selectNode(node.path);

    if (node.type === Enums.FileType.DIRECTORY) {
      const dir = node as DirectoryResponseDto;
      const wasExpanded = this.expandedPaths().has(node.path);
      this.toggleExpanded(dir.path);

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

  onRenameKeydown(event: KeyboardEvent): void {
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
  }

  expandPaths(paths: string[]): void {
    const expanded = new Set(this.expandedPaths());
    paths.forEach((p) => expanded.add(p));
    this.expandedPaths.set(expanded);
  }

  selectNode(path: string | null): void {
    this.selectedPath.set(path);
  }

  closeContextMenu = (): void => {
    this.contextMenu.update((state) => ({ ...state, visible: false }));
  };

  private focusRenameInputAfterRender(): void {
    const node = this.renamingNode();
    const input = this.renameInput()?.nativeElement;
    if (!node || !input) return;
    FileUtils.focusRenameInput(input, node.name);
  }

  private toggleExpanded(path: string): void {
    const expanded = new Set(this.expandedPaths());
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    this.expandedPaths.set(expanded);
  }
}
