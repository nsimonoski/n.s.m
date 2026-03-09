import { Component, input, output } from '@angular/core';
import { MonacoUtils } from '@org/shared/utils';

@Component({
  selector: 'ide-tab',
  standalone: true,
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
})
export class TabComponent {
  readonly file = input.required<MonacoUtils.OpenFile>();
  readonly isActive = input.required<boolean>();

  readonly selected = output<void>();
  readonly closed = output<void>();

  onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }
}
