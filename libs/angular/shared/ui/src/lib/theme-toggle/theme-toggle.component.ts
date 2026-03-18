import { Component, inject } from '@angular/core';
import { ThemeStore } from './theme.store';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent {
  readonly themeStore = inject(ThemeStore);
}
