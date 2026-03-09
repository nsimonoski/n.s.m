import { Component, output, input } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, ContextMenu } from '@org/shared/contracts';

@Component({
  selector: 'ui-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent {
  x = input.required<number>();
  y = input.required<number>();
  node = input<DirectoryResponseDto | FileResponseDto | null>(null);
  menuConfig = input.required<ContextMenu.Item[]>();

  itemClicked = output<{
    action: ContextMenu.Action;
    node: DirectoryResponseDto | FileResponseDto | null;
  }>();
  closed = output<void>();

  onItemClick(item: ContextMenu.Item): void {
    if (item.disabled || item.separator) {
      return;
    }
    this.itemClicked.emit({ action: item.action as ContextMenu.Action, node: this.node() });
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
