import { Component, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-docs',
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss',
})
export class DocsComponent {
  private readonly themeStore = inject(IdeStore.ThemeStore);
}
