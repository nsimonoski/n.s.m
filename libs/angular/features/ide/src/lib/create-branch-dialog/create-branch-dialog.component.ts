import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { GitBranchDto } from '@org/shared/contracts';

export interface CreateBranchEvent {
  branch: string;
  sourceBranch: string;
}

@Component({
  selector: 'ide-create-branch-dialog',
  standalone: true,
  imports: [FormField],
  templateUrl: './create-branch-dialog.component.html',
  styleUrls: ['./create-branch-dialog.component.scss'],
})
export class CreateBranchDialogComponent {
  branches = input<GitBranchDto[]>([]);
  currentBranch = input<string>('');
  confirmed = output<CreateBranchEvent>();
  cancelled = output<void>();

  readonly model = linkedSignal(() => ({ branchName: '', sourceBranch: this.currentBranch() }));
  readonly branchForm = form(this.model, (schema) => {
    required(schema.branchName, { message: 'Branch name is required' });
  });

  readonly localBranches = computed(() => this.branches().filter((b) => !b.remote));

  confirm(): void {
    const { branchName, sourceBranch } = this.model();
    if (branchName.trim()) {
      this.confirmed.emit({
        branch: branchName.trim(),
        sourceBranch: this.localBranches().length > 0 ? sourceBranch : '',
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
