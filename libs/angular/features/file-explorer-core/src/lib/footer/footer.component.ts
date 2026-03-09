import { Component, inject, signal } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { BranchPickerComponent } from '../branch-picker/branch-picker.component';
import { FileExplorerCoreStore } from '../file-explorer-core.store';

@Component({
  selector: 'ide-footer',
  standalone: true,
  imports: [BranchPickerComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly coreStore = inject(FileExplorerCoreStore);
  readonly authStore = inject(IdeStore.AuthStore);
  readonly branchPickerOpen = signal(false);

  openBranchPicker(): void {
    this.coreStore.listBranches();
    this.branchPickerOpen.set(true);
  }

  onBranchSelected(branchName: string): void {
    this.branchPickerOpen.set(false);
    this.coreStore.checkout(branchName);
  }

  closeBranchPicker(): void {
    this.branchPickerOpen.set(false);
  }

  logout(): void {
    this.authStore.logout();
  }
}
