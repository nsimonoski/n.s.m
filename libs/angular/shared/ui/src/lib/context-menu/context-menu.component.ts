import { Component, output, input } from '@angular/core';
import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { CONTEXT_MENU_ITEMS, ContextMenuAction, ContextMenuItem } from './context-menu.dto';

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

  itemClicked = output<{
    action: ContextMenuAction;
    node: DirectoryResponseDto | FileResponseDto | null;
  }>();
  closed = output<void>();

  get menuItems(): ContextMenuItem[] {
    const node = this.node();
    const isDirectory = node?.type === Enums.FileType.DIRECTORY;

    if (!node) {
      return [CONTEXT_MENU_ITEMS.NEW_FILE, CONTEXT_MENU_ITEMS.NEW_FOLDER];
    }

    if (isDirectory) {
      return [
        CONTEXT_MENU_ITEMS.NEW_FILE,
        CONTEXT_MENU_ITEMS.NEW_FOLDER,
        CONTEXT_MENU_ITEMS.SEPARATOR,
        CONTEXT_MENU_ITEMS.RENAME,
        CONTEXT_MENU_ITEMS.DELETE,
      ];
    } else {
      return [
        CONTEXT_MENU_ITEMS.OPEN,
        CONTEXT_MENU_ITEMS.SEPARATOR,
        CONTEXT_MENU_ITEMS.RENAME,
        CONTEXT_MENU_ITEMS.DELETE,
      ];
    }
  }

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
