import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { GitLogEntryDto } from '@org/shared/contracts';
import { CommitHistoryTooltipComponent } from '../commit-history-tooltip/commit-history-tooltip.component';

export interface TooltipState {
  entry: GitLogEntryDto;
  top: number;
  left: number;
  pinned: boolean;
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

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly outsideClickHandler = (e: MouseEvent) => this.onOutsideClick(e);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('click', this.outsideClickHandler);
    });
  }

  onEntryEnter(event: MouseEvent, entry: GitLogEntryDto): void {
    if (this.tooltip()?.pinned) return;
    const pos = this.getTooltipPosition(event.currentTarget as HTMLElement);
    this.tooltip.set({ entry, ...pos, pinned: false });
  }

  onEntryLeave(): void {
    if (this.tooltip()?.pinned) return;
    this.tooltip.set(null);
  }

  onEntryClick(event: MouseEvent, entry: GitLogEntryDto): void {
    event.stopPropagation();
    const current = this.tooltip();
    if (current?.pinned && current.entry.hash === entry.hash) {
      this.unpin();
      return;
    }
    const pos = this.getTooltipPosition(event.currentTarget as HTMLElement);
    this.tooltip.set({ entry, ...pos, pinned: true });
    this.document.addEventListener('click', this.outsideClickHandler);
  }

  private unpin(): void {
    this.tooltip.set(null);
    this.document.removeEventListener('click', this.outsideClickHandler);
  }

  private getTooltipPosition(el: HTMLElement): { top: number; left: number } {
    const entryRect = el.getBoundingClientRect();
    const panel = el.closest('.panel-content');
    const left = panel ? panel.getBoundingClientRect().right : entryRect.right;
    return { top: entryRect.top, left };
  }

  private onOutsideClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('ide-commit-history')) {
      this.unpin();
    }
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
