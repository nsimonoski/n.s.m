import { Component, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authStore = inject(IdeStore.AuthStore);
  private readonly themeStore = inject(IdeStore.ThemeStore);

  readonly isLoading = this.authStore.isLoading;

  signInWithGithub(): void {
    window.location.href = this.authStore.githubAuthUrl();
  }

  tryDemo(): void {
    this.authStore.guestLogin();
  }
}
