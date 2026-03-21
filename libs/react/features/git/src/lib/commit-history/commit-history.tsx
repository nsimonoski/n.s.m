import { useState } from 'react';
import type { GitLogEntryDto } from '@org/shared/contracts';
import { useGitCommitStore } from '@org/react-data-access';
import './commit-history.scss';

interface TooltipState {
  entry: GitLogEntryDto;
  top: number;
  left: number;
}

export function CommitHistory() {
  const commitHistory = useGitCommitStore((s) => s.commitHistory);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  function handleEntryEnter(event: React.MouseEvent, entry: GitLogEntryDto) {
    const el = event.currentTarget as HTMLElement;
    const entryRect = el.getBoundingClientRect();
    const panel = el.closest('.panel-content');
    const left = panel ? panel.getBoundingClientRect().right : entryRect.right;

    setTooltip({ entry, top: entryRect.top, left });
  }

  return (
    <div className="commit-list">
      {commitHistory.length === 0 && <div className="empty-state">No commits</div>}

      {commitHistory.map((entry) => (
        <div
          key={entry.hash}
          className="commit-entry"
          onMouseEnter={(e) => handleEntryEnter(e, entry)}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="commit-info">
            <span className="commit-message">{entry.message}</span>
            <span className="commit-meta">
              <span className="commit-author">{authorInitials(entry.author)}</span>
            </span>
          </div>
        </div>
      ))}

      {tooltip && (
        <div className="commit-tooltip" style={{ top: tooltip.top, left: tooltip.left }}>
          <div className="tooltip-header">
            <span className="tooltip-author">{tooltip.entry.author}</span>,{' '}
            <span className="tooltip-time">{relativeTime(tooltip.entry.date)}</span>{' '}
            <span className="tooltip-date">({formatDate(tooltip.entry.date)})</span>
          </div>

          <div className="tooltip-message">{tooltip.entry.message}</div>

          {tooltip.entry.body && <div className="tooltip-body">{tooltip.entry.body}</div>}

          {tooltip.entry.filesChanged > 0 && (
            <div className="tooltip-stats">
              <span>
                {tooltip.entry.filesChanged} file{tooltip.entry.filesChanged > 1 ? 's' : ''}{' '}
                changed
              </span>
              ,{' '}
              <span className="stat-insertions">
                {tooltip.entry.insertions} insertion{tooltip.entry.insertions !== 1 ? 's' : ''}(+)
              </span>
              ,{' '}
              <span className="stat-deletions">
                {tooltip.entry.deletions} deletion{tooltip.entry.deletions !== 1 ? 's' : ''}(-)
              </span>
            </div>
          )}

          <div className="tooltip-hash">
            <i className="codicon codicon-git-commit" />
            <span>{tooltip.entry.hash.substring(0, 7)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function authorInitials(fullName: string): string {
  const nameParts = fullName.split(' ');
  if (nameParts.length >= 2) {
    return nameParts[0][0] + nameParts[1][0];
  }
  return fullName.substring(0, 3);
}

function relativeTime(dateStr: string): string {
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

function formatDate(dateStr: string): string {
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
