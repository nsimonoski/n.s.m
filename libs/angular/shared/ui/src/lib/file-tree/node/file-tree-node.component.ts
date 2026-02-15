import { Component, computed, inject, input, output, Signal } from '@angular/core';

import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { FileTreeStore } from '../file-tree.store';

@Component({
  selector: 'app-file-tree-node',
  standalone: true,
  templateUrl: './file-tree-node.component.html',
  styleUrls: ['./file-tree-node.component.scss'],
})
export class FileTreeNodeComponent {
  private readonly store = inject(FileTreeStore);

  node = input.required<DirectoryResponseDto | FileResponseDto>();
  level = input<number>(0);

  nodeClicked = output<DirectoryResponseDto | FileResponseDto>();
  toggleExpand = output<DirectoryResponseDto>();
  contextMenu = output<{ mouseEvent: MouseEvent; node: DirectoryResponseDto | FileResponseDto }>();

  isExpanded = computed(() => this.store.isExpanded()(this.node().path));
  isSelected = computed(() => this.store.isSelected()(this.node().path));
  isDirectory = computed(() => this.node().type === Enums.FileType.DIRECTORY);

  hasChildren = this.getHasChildren();
  children = this.getChildren();

  isGrayed = computed(() => this.node().gitIgnored === true);
  indentGuides = computed(() => Array(this.level()).fill(0));
  fileIcon = computed(() => FileUtils.getFileIcon(this.node().type, this.isExpanded()));
  expandIcon = computed(() => FileUtils.getExpandIcon(this.isExpanded()));

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
