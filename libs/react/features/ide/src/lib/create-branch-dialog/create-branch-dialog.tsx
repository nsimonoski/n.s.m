import { useMemo, useState } from 'react';
import type { GitBranchDto } from '@org/shared/contracts';
import './create-branch-dialog.scss';

export interface CreateBranchEvent {
  branch: string;
  sourceBranch: string;
}

interface CreateBranchDialogProps {
  branches: GitBranchDto[];
  currentBranch: string;
  onConfirm: (event: CreateBranchEvent) => void;
  onCancel: () => void;
}

export function CreateBranchDialog({
  branches,
  currentBranch,
  onConfirm,
  onCancel,
}: CreateBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  const [sourceBranch, setSourceBranch] = useState(currentBranch);
  const localBranches = useMemo(() => branches.filter((b) => !b.remote), [branches]);

  function handleConfirm() {
    const trimmed = branchName.trim();
    if (!trimmed) return;

    onConfirm({
      branch: trimmed,
      sourceBranch: localBranches.length > 0 ? sourceBranch : '',
    });
  }

  return (
    <div className="backdrop" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-title">Create new branch</div>

        {localBranches.length > 0 && (
          <div className="dialog-field">
            <label className="dialog-label" htmlFor="source-branch">
              Source branch
            </label>
            <select
              id="source-branch"
              className="dialog-select"
              value={sourceBranch}
              onChange={(e) => setSourceBranch(e.target.value)}
            >
              {localBranches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="dialog-field">
          <label className="dialog-label" htmlFor="branch-name">
            Branch name
          </label>
          <input
            id="branch-name"
            className="dialog-input"
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder="e.g. feature/my-branch"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
        </div>

        <div className="dialog-actions">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-confirm"
            disabled={!branchName.trim()}
            onClick={handleConfirm}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
