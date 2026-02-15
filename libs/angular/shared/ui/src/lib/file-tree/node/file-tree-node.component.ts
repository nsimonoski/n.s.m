import { Component, computed, effect, ElementRef, inject, input, output, Signal, viewChild } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { FileTreeStore } from '../file-tree.store';
import { FileTreeCreateNodeComponent } from '../create-node/file-tree-create-node.component';
import { InlineCreateEvent, InlineRenameEvent } from '../../context-menu/context-menu.dto';

@Component({
  selector: 'app-file-tree-node',
  standalone: true,
  imports: [FileTreeCreateNodeComponent],
  templateUrl: './file-tree-node.component.html',
  styleUrls: ['./file-tree-node.component.scss'],
})
export class FileTreeNodeComponent {
  private readonly store = inject(FileTreeStore);
  private escapedRename = false;

  node = input.required<DirectoryResponseDto | FileResponseDto>();
  level = input<number>(0);
  renamingPath = input<string | null>(null);

  nodeClicked = output<DirectoryResponseDto | FileResponseDto>();
  toggleExpand = output<DirectoryResponseDto>();
  contextMenu = output<{ mouseEvent: MouseEvent; node: DirectoryResponseDto | FileResponseDto }>();
  inlineCreateConfirmed = output<InlineCreateEvent>();
  renameConfirmed = output<InlineRenameEvent>();
  renameCancelled = output<void>();

  renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  isExpanded = computed(() => this.store.isExpanded()(this.node().path));
  isSelected = computed(() => this.store.isSelected()(this.node().path));
  isDirectory = computed(() => this.node().type === Enums.FileType.DIRECTORY);
  isRenaming = computed(() => this.renamingPath() === this.node().path);

  hasChildren = this.getHasChildren();
  children = this.getChildren();

  isGrayed = computed(() => this.node().gitIgnored === true);
  indentGuides = computed(() => Array(this.level()).fill(0));
  fileIcon = computed(() => FileUtils.getFileIcon(this.node().type, this.isExpanded()));
  expandIcon = computed(() => FileUtils.getExpandIcon(this.isExpanded()));

  inlineCreateActive = computed(() => !!this.store.inlineCreateFor()(this.node().path));

  constructor() {
    effect(() => {
      if (this.isRenaming()) {
        setTimeout(() => {
          const input = this.renameInput()?.nativeElement;
          if (!input) return;
          input.focus();

          const name = this.node().name;
          const dotIndex = name.lastIndexOf('.');
          if (dotIndex > 0 && !this.isDirectory()) {
            input.setSelectionRange(0, dotIndex);
          } else {
            input.select();
          }
        });
      }
    });
  }

  onNodeClick(): void {
    if (this.isDirectory()) {
      this.toggleExpand.emit(this.node() as DirectoryResponseDto);
    }
    this.nodeClicked.emit(this.node());
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.emit({ mouseEvent: event, node: this.node() });
  }

  onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    } else if (event.key === 'Escape') {
      this.escapedRename = true;
      this.renameCancelled.emit();
    }
  }

  onRenameBlur(event: FocusEvent): void {
    if (this.escapedRename) {
      this.escapedRename = false;
      return;
    }

    const newName = (event.target as HTMLInputElement).value.trim();
    if (newName && newName !== this.node().name) {
      this.renameConfirmed.emit({ node: this.node(), newName });
    }
    this.renameCancelled.emit();
  }

  private getHasChildren(): Signal<boolean> {
    return computed(() => {
      if (!this.isDirectory()) {
        return false;
      }
      const dir = this.node() as DirectoryResponseDto;
      return dir.directories.length > 0 || dir.files.length > 0;
    });
  }

  private getChildren() {
    return computed(() => {
      if (!this.isDirectory()) {
        return [];
      }
      const dir = this.node() as DirectoryResponseDto;
      return [...dir.directories, ...dir.files];
    });
  }
}
