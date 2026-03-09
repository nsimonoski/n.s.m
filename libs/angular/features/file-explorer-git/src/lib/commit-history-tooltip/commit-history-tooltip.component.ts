import { Component, input } from '@angular/core';
import { GitLogEntryDto } from '@org/shared/contracts';

@Component({
  selector: 'ide-commit-history-tooltip',
  standalone: true,
  templateUrl: './commit-history-tooltip.component.html',
  styleUrls: ['./commit-history-tooltip.component.scss'],
  host: {
    '[style.top.px]': 'top()',
    '[style.left.px]': 'left()',
  },
})
export class CommitHistoryTooltipComponent {
  readonly entry = input.required<GitLogEntryDto>();
  readonly top = input.required<number>();
  readonly left = input.required<number>();

  shortHash(hash: string): string {
    return hash.substring(0, 7);
  }

  relativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
