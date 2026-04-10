import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import {
  mockSnackbarService,
  mockGitService,
  mockGitStatusStore,
} from '@org/angular-testing';
import { withGitActions } from './with-git-actions.store';
import { GitService } from '../git.service';
import { GitStatusStore } from '../ide-store';

describe('withGitActions', () => {
  const TestStore = signalStore(
    { providedIn: 'root' },
    withState({ name: 'test' }),
    withGitActions(),
  );

  function setup() {
    const git = mockGitService();
    const snackbar = mockSnackbarService();
    TestBed.configureTestingModule({
      providers: [
        { provide: GitService, useValue: git },
        { provide: SnackbarService, useValue: snackbar },
        { provide: GitStatusStore, useValue: mockGitStatusStore() },
      ],
    });
    return { store: TestBed.inject(TestStore), git, snackbar };
  }

  describe('gitCommit', () => {
    it('should call commit and show success', () => {
      const { store, git, snackbar } = setup();
      store.gitCommit('feat: add feature');
      expect(git.commit).toHaveBeenCalledWith('/workspace/repo', 'feat: add feature');
      expect(snackbar.success).toHaveBeenCalledWith('Committed!', undefined);
    });

    it('should show error on failure', () => {
      const { store, git, snackbar } = setup();
      git.commit.mockReturnValue(of({ success: false, error: 'Commit failed' }));
      store.gitCommit('bad commit');
      expect(snackbar.error).toHaveBeenCalledWith('Commit failed', undefined);
    });
  });

  describe('gitPush', () => {
    it('should call push and show success', () => {
      const { store, git, snackbar } = setup();
      store.gitPush();
      expect(git.push).toHaveBeenCalledWith('/workspace/repo');
      expect(snackbar.success).toHaveBeenCalledWith('Pushed!', undefined);
    });

    it('should show error on failure', () => {
      const { store, git, snackbar } = setup();
      git.push.mockReturnValue(of({ success: false, error: 'Push rejected' }));
      store.gitPush();
      expect(snackbar.error).toHaveBeenCalledWith('Push rejected', undefined);
    });
  });

  describe('gitStage', () => {
    it('should call stage with paths', () => {
      const { store, git } = setup();
      store.gitStage(['src/main.ts', 'src/app.ts']);
      expect(git.stage).toHaveBeenCalledWith('/workspace/repo', [
        'src/main.ts',
        'src/app.ts',
      ]);
    });
  });

  describe('gitUnstage', () => {
    it('should call unstage with paths', () => {
      const { store, git } = setup();
      store.gitUnstage(['src/main.ts']);
      expect(git.unstage).toHaveBeenCalledWith('/workspace/repo', ['src/main.ts']);
    });
  });

  describe('gitDiscard', () => {
    it('should call discard with paths', () => {
      const { store, git } = setup();
      store.gitDiscard(['src/main.ts']);
      expect(git.discard).toHaveBeenCalledWith('/workspace/repo', ['src/main.ts']);
    });
  });

  describe('gitStash', () => {
    it('should call stash and show success', () => {
      const { store, git, snackbar } = setup();
      store.gitStash();
      expect(git.stash).toHaveBeenCalledWith('/workspace/repo');
      expect(snackbar.success).toHaveBeenCalledWith('Stashed!', undefined);
    });

    it('should show error on failure', () => {
      const { store, git, snackbar } = setup();
      git.stash.mockReturnValue(of({ success: false, error: 'Nothing to stash' }));
      store.gitStash();
      expect(snackbar.error).toHaveBeenCalledWith('Nothing to stash', undefined);
    });
  });

  describe('gitStashPop', () => {
    it('should call stashPop and show success', () => {
      const { store, git, snackbar } = setup();
      store.gitStashPop();
      expect(git.stashPop).toHaveBeenCalledWith('/workspace/repo');
      expect(snackbar.success).toHaveBeenCalledWith('Stash popped!', undefined);
    });
  });

  describe('gitStashApply', () => {
    it('should call stashApply and show success', () => {
      const { store, git, snackbar } = setup();
      store.gitStashApply();
      expect(git.stashApply).toHaveBeenCalledWith('/workspace/repo');
      expect(snackbar.success).toHaveBeenCalledWith('Stash applied!', undefined);
    });
  });
});
