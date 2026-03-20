import { useEffect } from 'react';
import { GIT_CHANGE_EVENT, GIT_WATCH_EVENT, GitStatusTreeResponseDto } from '@org/shared/contracts';
import { socketService } from '../services/socket.service';
import { useGitChangesStore } from '../stores/git-changes.store';
import { useGitStatusStore } from '../stores/git-status.store';

export function useGitWatcher(path: string | null): void {
  useEffect(() => {
    if (!path) return;

    socketService.watch(GIT_WATCH_EVENT, path);

    const unsubscribe = socketService.on<GitStatusTreeResponseDto>(GIT_CHANGE_EVENT, (response) => {
      useGitChangesStore.getState().applyStatusUpdate(response.tree, response.statusMap);
      useGitStatusStore.getState().updateGitStatus({
        branch: response.branch,
        tracking: response.tracking,
        stagedCount: response.stagedCount,
        changesCount: response.changesCount,
        ahead: response.ahead,
        behind: response.behind,
      });
    });

    return unsubscribe;
  }, [path]);
}
