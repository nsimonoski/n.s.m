import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { DropdownMenuPanelComponent } from './dropdown-menu-panel.component';

export interface DropdownMenuItem {
  id: string;
  label: string;
  children?: DropdownMenuItem[];
}

@Component({
  selector: 'ui-dropdown-menu',
  standalone: true,
  imports: [DropdownMenuPanelComponent],
  templateUrl: './dropdown-menu.component.html',
  styleUrls: ['./dropdown-menu.component.scss'],
})
export class DropdownMenuComponent {
  items = input.required<DropdownMenuItem[]>();
  actionClicked = output<string>();

  readonly isOpen = signal(false);

  private readonly el = inject(ElementRef);

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  onAction(id: string): void {
    this.actionClicked.emit(id);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.el.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  private close(): void {
    this.isOpen.set(false);
  }
}
