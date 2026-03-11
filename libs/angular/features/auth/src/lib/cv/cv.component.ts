import { Component, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-cv',
  templateUrl: './cv.component.html',
  styleUrl: './cv.component.scss',
})
export class CvComponent {
  private readonly themeStore = inject(IdeStore.ThemeStore);
}
