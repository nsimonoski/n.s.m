import { Component, inject, signal } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { ThemeToggleComponent } from '@org/angular/ui';
import { BranchPickerComponent } from '../branch-picker/branch-picker.component';
import {
  CreateBranchDialogComponent,
  CreateBranchEvent,
} from '../create-branch-dialog/create-branch-dialog.component';

@Component({
  selector: 'ide-footer',
  standalone: true,
  imports: [BranchPickerComponent, CreateBranchDialogComponent, ThemeToggleComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly gitStatusStore = inject(IdeStore.GitStatusStore);
  readonly authStore = inject(IdeStore.AuthStore);
  readonly branchPickerOpen = signal(false);
  readonly createBranchDialogOpen = signal(false);

  openBranchPicker(): void {
    this.gitStatusStore.listBranches();
    this.branchPickerOpen.set(true);
  }

  onBranchSelected(branchName: string): void {
    this.branchPickerOpen.set(false);
    this.gitStatusStore.checkout(branchName);
  }

  onCreateBranch(): void {
    this.branchPickerOpen.set(false);
    this.createBranchDialogOpen.set(true);
  }

  onBranchCreated(event: CreateBranchEvent): void {
    this.createBranchDialogOpen.set(false);
    this.gitStatusStore.createBranch(event);
  }

  closeCreateBranchDialog(): void {
    this.createBranchDialogOpen.set(false);
  }

  closeBranchPicker(): void {
    this.branchPickerOpen.set(false);
  }

  logout(): void {
    this.authStore.logout();
  }
}
