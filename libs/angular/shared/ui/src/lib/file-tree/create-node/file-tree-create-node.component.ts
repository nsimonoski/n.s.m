import { afterNextRender, Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { Enums } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { FileTreeStore } from '../file-tree.store';

@Component({
  selector: 'ui-file-tree-create-node',
  standalone: true,
  templateUrl: './file-tree-create-node.component.html',
  styleUrls: ['./file-tree-create-node.component.scss'],
})
export class FileTreeCreateNodeComponent {
  private readonly store = inject(FileTreeStore);

  level = input<number>(0);
  confirmed = output<{ parentPath: string; name: string; type: 'file' | 'directory' }>();

  nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  indentGuides = computed(() => Array(this.level()).fill(0));

  icon = computed(() => {
    const info = this.store.inlineCreate();
    if (!info) return null;
    return info.type === 'directory'
      ? FileUtils.getFileIcon(Enums.FileType.DIRECTORY, false)
      : FileUtils.getFileIcon(Enums.FileType.OTHER, false);
  });

  constructor() {
    afterNextRender(() => this.nameInput()?.nativeElement.focus());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const name = (event.target as HTMLInputElement).value.trim();
      const info = this.store.inlineCreate();
      if (name && info) {
        this.confirmed.emit({ parentPath: info.parentPath, name, type: info.type });
      }
      this.store.cancelInlineCreate();
    } else if (event.key === 'Escape') {
      this.store.cancelInlineCreate();
    }
  }

  onBlur(): void {
    this.store.cancelInlineCreate();
  }
}
