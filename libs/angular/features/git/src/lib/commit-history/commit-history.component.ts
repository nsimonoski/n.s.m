import { Component, computed, input, signal } from '@angular/core';
import { GitLogEntryDto } from '@org/shared/contracts';
import { CommitHistoryTooltipComponent } from '../commit-history-tooltip/commit-history-tooltip.component';

export interface TooltipState {
  entry: GitLogEntryDto;
  top: number;
  left: number;
}

@Component({
  selector: 'ide-commit-history',
  standalone: true,
  imports: [CommitHistoryTooltipComponent],
  templateUrl: './commit-history.component.html',
  styleUrls: ['./commit-history.component.scss'],
})
export class CommitHistoryComponent {
  readonly entries = input.required<GitLogEntryDto[]>();
  readonly tooltip = signal<TooltipState | null>(null);

  readonly displayEntries = computed(() =>
    this.entries().map((entry) => ({
      ...entry,
      initials: this.authorInitials(entry.author),
    })),
  );

  onEntryEnter(event: MouseEvent, entry: GitLogEntryDto): void {
    const el = event.currentTarget as HTMLElement;
    const entryRect = el.getBoundingClientRect();
    const panel = el.closest('.panel-content');
    const left = panel ? panel.getBoundingClientRect().right : entryRect.right;

    this.tooltip.set({ entry, top: entryRect.top, left });
  }

  onEntryLeave(): void {
    this.tooltip.set(null);
  }

  private authorInitials(fullName: string): string {
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 2) {
      const firstInitial = nameParts[0][0];
      const lastInitial = nameParts[1][0];
      return firstInitial + lastInitial;
    }
    return fullName.substring(0, 3);
  }
}
