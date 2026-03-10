import { Component, inject, signal } from '@angular/core';
import { ContextMenu } from '@org/shared/contracts';
import { IdeStore } from '@org/angular-data-access';
import { ContextMenuComponent, ContextMenuActionEvent } from '@org/angular/ui';
import { TabComponent } from './tab/tab.component';

@Component({
  selector: 'ide-tab-bar',
  standalone: true,
  imports: [TabComponent, ContextMenuComponent],
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
})
export class TabBarComponent {
  readonly store = inject(IdeStore.CodeEditorStore);
  readonly menuItems = ContextMenu.TAB_ITEMS;
  readonly contextMenu = signal<{ x: number; y: number; tabId: string } | null>(null);

  onContextMenu(event: MouseEvent, tabId: string): void {
    event.preventDefault();
    this.contextMenu.set({ x: event.clientX, y: event.clientY, tabId });
  }

  closeContextMenu(): void {
    this.contextMenu.set(null);
  }

  onMenuAction(event: ContextMenuActionEvent): void {
    const menu = this.contextMenu();
    if (!menu) return;

    this.contextMenu.set(null);

    switch (event.action) {
      case ContextMenu.Action.CLOSE:
        return this.store.closeFile(menu.tabId);
      case ContextMenu.Action.CLOSE_OTHERS:
        return this.store.closeOthers(menu.tabId);
      case ContextMenu.Action.CLOSE_TO_THE_RIGHT:
        return this.store.closeToTheRight(menu.tabId);
      case ContextMenu.Action.CLOSE_SAVED:
        return this.store.closeSaved();
      case ContextMenu.Action.CLOSE_ALL:
        return this.store.closeAll();
    }
  }
}
