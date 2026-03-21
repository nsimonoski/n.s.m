import { useMemo } from 'react';
import type { GitBranchDto } from '@org/shared/contracts';
import { CommandPalette, type CommandPaletteItem } from '@org/react-ui';

const CREATE_BRANCH_ID = '__create__';

interface BranchPickerProps {
  branches: GitBranchDto[];
  canCreate: boolean;
  onBranchSelected: (branchName: string) => void;
  onCreateBranch: () => void;
  onClose: () => void;
}

export function BranchPicker({
  branches,
  canCreate,
  onBranchSelected,
  onCreateBranch,
  onClose,
}: BranchPickerProps) {
  const items = useMemo<CommandPaletteItem[]>(() => {
    const local = branches.filter((b) => !b.remote);
    const remote = branches.filter((b) => b.remote);

    const branchItems = [...local, ...remote].map((b, i) => ({
      id: b.name,
      label: b.name,
      description: buildDescription(b),
      disabled: b.current,
      divider: b.remote && i === local.length,
    }));

    if (canCreate) {
      return [{ id: CREATE_BRANCH_ID, label: '+ Create new branch...' }, ...branchItems];
    }

    return branchItems;
  }, [branches, canCreate]);

  function handleItemSelected(item: CommandPaletteItem) {
    if (item.id === CREATE_BRANCH_ID) {
      onCreateBranch();
      return;
    }
    onBranchSelected(item.id);
  }

  return (
    <CommandPalette
      items={items}
      placeholder="Switch branch..."
      onItemSelected={handleItemSelected}
      onClose={onClose}
    />
  );
}

function buildDescription(branch: GitBranchDto): string {
  const { lastCommit } = branch;
  const parts: string[] = [];

  if (branch.current) parts.push('current');

  if (lastCommit?.message) {
    parts.push(lastCommit.author, relativeTime(lastCommit.date), lastCommit.message);
  }

  return parts.join(' · ');
}

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
