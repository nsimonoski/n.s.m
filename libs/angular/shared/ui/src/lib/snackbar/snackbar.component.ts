import { Component, inject } from '@angular/core';
import { SnackbarService } from './snackbar.service';

@Component({
  selector: 'ui-snackbar',
  standalone: true,
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent {
  private readonly snackbar = inject(SnackbarService);
  readonly state = this.snackbar.state;
  readonly dismiss = () => this.snackbar.dismiss();
}
