import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Enums, ContextMenu } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';

@Component({
  selector: 'ui-file-tree-create-node',
  standalone: true,
  templateUrl: './file-tree-create-node.component.html',
  styleUrls: ['./file-tree-create-node.component.scss'],
})
export class FileTreeCreateNodeComponent {
  level = input<number>(0);
  inlineCreate = input.required<ContextMenu.InlineCreate>();

  confirmed = output<{ parentPath: string; name: string; type: 'file' | 'directory' }>();
  cancelled = output<void>();

  nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  indentGuides = computed(() => Array(this.level()).fill(0));

  icon = computed(() => {
    const info = this.inlineCreate();
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
      const info = this.inlineCreate();
      if (name && info) {
        this.confirmed.emit({ parentPath: info.parentPath, name, type: info.type });
      }
      this.cancelled.emit();
    } else if (event.key === 'Escape') {
      this.cancelled.emit();
    }
  }

  onBlur(): void {
    this.cancelled.emit();
  }
}
