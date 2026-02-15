import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="backdrop" (click)="cancelled.emit()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-title">{{ title() }}</div>
          <div class="dialog-message">{{ message() }}</div>
          <div class="dialog-actions">
            <button class="btn btn-cancel" (click)="cancelled.emit()">Cancel</button>
            <button class="btn btn-confirm" (click)="confirmed.emit()">Confirm</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  isOpen = input.required<boolean>();
  title = input<string>('');
  message = input<string>('');
  confirmed = output();
  cancelled = output();
}
