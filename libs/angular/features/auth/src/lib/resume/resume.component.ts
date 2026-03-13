import { Component, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-resume',
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.scss',
})
export class ResumeComponent {
  private readonly themeStore = inject(IdeStore.ThemeStore);
}
