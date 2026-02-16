import { Component, output, input } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';
import { ContextMenuAction, ContextMenuItem } from './context-menu.dto';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent {
  x = input.required<number>();
  y = input.required<number>();
  node = input<DirectoryResponseDto | FileResponseDto | null>(null);
  menuConfig = input.required<ContextMenuItem[]>();

  itemClicked = output<{
    action: ContextMenuAction;
    node: DirectoryResponseDto | FileResponseDto | null;
  }>();
  closed = output<void>();

  onItemClick(item: ContextMenuItem): void {
    if (item.disabled || item.separator) {
      return;
    }
    this.itemClicked.emit({ action: item.action as ContextMenuAction, node: this.node() });
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
