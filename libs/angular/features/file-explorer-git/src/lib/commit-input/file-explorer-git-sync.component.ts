import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileExplorerGitStore } from '../file-explorer-git.store';

@Component({
  selector: 'ide-file-explorer-git-sync',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './file-explorer-git-sync.component.html',
  styleUrls: ['./file-explorer-git-sync.component.scss'],
})
export class FileExplorerGitSyncComponent {
  readonly store = inject(FileExplorerGitStore);
  readonly hasStagedFiles = computed(() => {
    const tree = this.store.changesTree();
    return tree?.directories.some((d) => d.path === '/staged') ?? false;
  });
  readonly hasPendingSync = computed(() => this.store.ahead() > 0 && !this.hasStagedFiles());
  readonly syncLabel = computed(() => `Sync Changes (${this.store.ahead()})`);

  onSync(): void {
    if (this.hasPendingSync()) {
      this.store.sync();
    } else {
      this.onCommit();
    }
  }

  onCommit(): void {
    const trimmed = this.store.commitMessage().trim();
    if (!trimmed) return;
    this.store.commit(trimmed);
  }

  autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.onCommit();
    }
  }
}
