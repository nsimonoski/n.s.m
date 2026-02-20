import { Component, input, output, signal } from '@angular/core';
import { DropdownMenuItem } from './dropdown-menu.component';

@Component({
  selector: 'ui-dropdown-menu-panel',
  standalone: true,
  imports: [DropdownMenuPanelComponent],
  templateUrl: './dropdown-menu-panel.component.html',
  styleUrls: ['./dropdown-menu-panel.component.scss'],
})
export class DropdownMenuPanelComponent {
  items = input.required<DropdownMenuItem[]>();
  actionClicked = output<string>();

  readonly expandedItemId = signal<string | null>(null);

  onItemClick(item: DropdownMenuItem): void {
    if (item.children?.length) {
      this.expandedItemId.update((id) => (id === item.id ? null : item.id));
      return;
    }
    this.actionClicked.emit(item.id);
  }

  onChildAction(id: string): void {
    this.actionClicked.emit(id);
  }
}
