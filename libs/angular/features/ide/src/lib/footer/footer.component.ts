import { Component, inject, signal } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { BranchPickerComponent } from '../branch-picker/branch-picker.component';

@Component({
  selector: 'ide-footer',
  standalone: true,
  imports: [BranchPickerComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly gitStatusStore = inject(IdeStore.GitStatusStore);
  readonly authStore = inject(IdeStore.AuthStore);
  readonly themeStore = inject(IdeStore.ThemeStore);
  readonly branchPickerOpen = signal(false);

  openBranchPicker(): void {
    this.gitStatusStore.listBranches();
    this.branchPickerOpen.set(true);
  }

  onBranchSelected(branchName: string): void {
    this.branchPickerOpen.set(false);
    this.gitStatusStore.checkout(branchName);
  }

  closeBranchPicker(): void {
    this.branchPickerOpen.set(false);
  }

  logout(): void {
    this.authStore.logout();
  }
}
