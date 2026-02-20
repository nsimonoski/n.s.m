import { Component, inject, signal } from '@angular/core';
import { editor } from '@org/angular-data-access';
import {
  ContextMenuComponent,
  ContextMenuAction,
  ContextMenuActionEvent,
  TAB_CONTEXT_MENU_ITEMS,
} from '@org/angular/ui';
import { TabComponent } from './tab/tab.component';

@Component({
  selector: 'ide-tab-bar',
  standalone: true,
  imports: [TabComponent, ContextMenuComponent],
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  readonly store = inject(editor.CodeEditorStore);
  readonly menuItems = TAB_CONTEXT_MENU_ITEMS;
  readonly contextMenu = signal<{ x: number; y: number; path: string } | null>(null);

  onContextMenu(event: MouseEvent, path: string): void {
    event.preventDefault();
    this.contextMenu.set({ x: event.clientX, y: event.clientY, path });
  }

  closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  onMenuAction(event: ContextMenuActionEvent): void {
    const menu = this.contextMenu();
    if (!menu) return;

    this.contextMenu.set(null);

    switch (event.action) {
      case ContextMenuAction.CLOSE:
        return this.store.closeFile(menu.path);
      case ContextMenuAction.CLOSE_OTHERS:
        return this.store.closeOthers(menu.path);
      case ContextMenuAction.CLOSE_TO_THE_RIGHT:
        return this.store.closeToTheRight(menu.path);
      case ContextMenuAction.CLOSE_SAVED:
        return this.store.closeSaved();
      case ContextMenuAction.CLOSE_ALL:
        return this.store.closeAll();
    }
  }
}
