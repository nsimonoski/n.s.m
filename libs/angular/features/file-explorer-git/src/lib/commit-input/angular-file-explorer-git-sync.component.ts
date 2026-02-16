import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularFileExplorerGitStore } from '../angular-file-explorer-git.store';

@Component({
  selector: 'app-angular-file-explorer-git-sync',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './angular-file-explorer-git-sync.component.html',
  styleUrls: ['./angular-file-explorer-git-sync.component.scss'],
})
export class AngularFileExplorerGitSyncComponent {
  readonly store = inject(AngularFileExplorerGitStore);

  onCommit(): void {
    const trimmed = this.store.commitMessage().trim();
    if (!trimmed) return;
    this.store.commit(trimmed);
  }

  onMessageChange(value: string): void {
    this.store.setCommitMessage(value);
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
