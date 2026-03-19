import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GitStatusStore } from '@org/angular-data-access';
import { GitChangesStore } from '../git-changes.store';
import { GitCommitStore } from '../git-commit.store';

@Component({
  selector: 'ide-git-sync',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './git-sync.component.html',
  styleUrls: ['./git-sync.component.scss'],
})
export class GitSyncComponent {
  readonly gitStatusStore = inject(GitStatusStore);
  readonly changesStore = inject(GitChangesStore);
  readonly commitStore = inject(GitCommitStore);

  readonly hasStagedFiles = computed(() => {
    const tree = this.changesStore.changesTree();
    return tree?.directories.some((d) => d.path === '/staged') ?? false;
  });
  readonly hasPendingSync = computed(() => this.gitStatusStore.ahead() > 0 && !this.hasStagedFiles());
  readonly syncLabel = computed(() => `Push (${this.gitStatusStore.ahead()})`);

  onSync(): void {
    if (this.hasPendingSync()) {
      this.commitStore.sync();
    } else {
      this.onCommit();
    }
  }

  onCommit(): void {
    const trimmed = this.commitStore.commitMessage().trim();
    if (!trimmed) return;
    this.commitStore.commit(trimmed);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.onCommit();
    }
  }
}
