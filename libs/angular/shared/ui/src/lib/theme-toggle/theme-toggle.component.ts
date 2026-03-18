import { Component, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
})
export class ThemeToggleComponent {
  readonly themeStore = inject(IdeStore.ThemeStore);
}
