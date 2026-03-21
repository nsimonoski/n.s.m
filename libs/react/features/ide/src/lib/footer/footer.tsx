import { useCallback, useState } from 'react';
import { useAuthStore, useGitStatusStore } from '@org/react-data-access';
import { BranchPicker } from '../branch-picker/branch-picker';
import { CreateBranchDialog, type CreateBranchEvent } from '../create-branch-dialog/create-branch-dialog';
import './footer.scss';

export function Footer() {
  const branch = useGitStatusStore((s) => s.branch);
  const branches = useGitStatusStore((s) => s.branches);
  const listBranches = useGitStatusStore((s) => s.listBranches);
  const checkout = useGitStatusStore((s) => s.checkout);
  const createBranch = useGitStatusStore((s) => s.createBranch);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [createBranchDialogOpen, setCreateBranchDialogOpen] = useState(false);

  const openBranchPicker = useCallback(() => {
    listBranches();
    setBranchPickerOpen(true);
  }, [listBranches]);

  const handleBranchSelected = useCallback(
    (branchName: string) => {
      setBranchPickerOpen(false);
      checkout(branchName);
    },
    [checkout],
  );

  const handleCreateBranch = useCallback(() => {
    setBranchPickerOpen(false);
    setCreateBranchDialogOpen(true);
  }, []);

  const handleBranchCreated = useCallback(
    (event: CreateBranchEvent) => {
      setCreateBranchDialogOpen(false);
      createBranch(event.branch, event.sourceBranch || undefined);
    },
    [createBranch],
  );

  return (
    <>
      <div className="footer">
        <span className="branch" onClick={openBranchPicker}>
          <img className="branch-icon" src="icons/git-branch.svg" alt="branch" />
          {branch}
        </span>

        <span className="spacer" />

        <span className="user-info">
          {profile?.username}
          {profile?.isGuest && <span className="badge">guest</span>}
        </span>

        <button className="footer-btn" onClick={logout} title="Logout">
          <i className="codicon codicon-sign-out" />
        </button>
      </div>

      {branchPickerOpen && (
        <BranchPicker
          branches={branches}
          canCreate={!profile?.isGuest}
          onBranchSelected={handleBranchSelected}
          onCreateBranch={handleCreateBranch}
          onClose={() => setBranchPickerOpen(false)}
        />
      )}

      {createBranchDialogOpen && (
        <CreateBranchDialog
          branches={branches}
          currentBranch={branch}
          onConfirm={handleBranchCreated}
          onCancel={() => setCreateBranchDialogOpen(false)}
        />
      )}
    </>
  );
}
