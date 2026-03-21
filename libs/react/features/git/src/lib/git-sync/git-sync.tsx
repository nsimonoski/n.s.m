import { useGitCommitStore, useGitChangesStore } from '@org/react-data-access';
import { useGitStatusStore } from '@org/react-data-access';
import './git-sync.scss';

export function GitSync() {
  const commitMessage = useGitCommitStore((s) => s.commitMessage);
  const setCommitMessage = useGitCommitStore((s) => s.setCommitMessage);
  const commit = useGitCommitStore((s) => s.commit);
  const push = useGitCommitStore((s) => s.push);
  const isCommitting = useGitCommitStore((s) => s.isCommitting);
  const isPushing = useGitCommitStore((s) => s.isPushing);

  const ahead = useGitStatusStore((s) => s.ahead);
  const tracking = useGitStatusStore((s) => s.tracking);

  const changesTree = useGitChangesStore((s) => s.changesTree);
  const hasStagedFiles = changesTree?.directories.some((d) => d.path === '/staged') ?? false;

  const isUntracked = !tracking;
  const hasPendingSync = (ahead > 0 || isUntracked) && !hasStagedFiles;
  const syncLabel = isUntracked ? 'Publish Branch' : `Push (${ahead})`;

  function handleCommit() {
    const trimmed = commitMessage.trim();
    if (!trimmed || !hasStagedFiles) return;
    commit(trimmed);
  }

  function handleKeydown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleCommit();
    }
  }

  return (
    <div className="commit-input">
      <textarea
        className="message-input"
        placeholder="Message (Ctrl+Enter to commit)"
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        onKeyDown={handleKeydown}
        rows={1}
      />
      {hasPendingSync ? (
        <button className="commit-button sync" onClick={push} disabled={isPushing}>
          {syncLabel}
        </button>
      ) : (
        <button
          className="commit-button"
          disabled={!commitMessage.trim() || !hasStagedFiles || isCommitting}
          onClick={handleCommit}
        >
          Commit
        </button>
      )}
    </div>
  );
}
