import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-clone-repo',
  imports: [ReactiveFormsModule],
  templateUrl: './clone-repo.component.html',
  styleUrl: './clone-repo.component.scss',
})
export class CloneRepoComponent {
  private readonly authStore = inject(IdeStore.AuthStore);

  readonly profile = this.authStore.profile;
  readonly isLoading = this.authStore.isLoading;
  readonly errorMessage = this.authStore.errorMessage;
  readonly repoUrl = new FormControl('https://github.com/nsimonoski/n.s.m');

  clone(): void {
    const url = this.repoUrl.value?.trim();
    if (!url) {
      return;
    }
    this.authStore.cloneRepo(url);
  }

  logout(): void {
    this.authStore.logout();
  }
}
