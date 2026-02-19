import { Component, computed, input, output } from '@angular/core';
import { GitBranchDto } from '@org/shared/contracts';
import { CommandPaletteComponent, CommandPaletteItem } from '@org/angular/ui';

@Component({
  selector: 'ide-branch-picker',
  standalone: true,
  imports: [CommandPaletteComponent],
  templateUrl: './branch-picker.component.html',
})
export class BranchPickerComponent {
  branches = input.required<GitBranchDto[]>();
  branchSelected = output<string>();
  closed = output<void>();

  readonly items = computed<CommandPaletteItem[]>(() => {
    const branches = this.branches();
    const local = branches.filter((b) => !b.remote);
    const remote = branches.filter((b) => b.remote);

    return [...local, ...remote].map((b, i) => ({
      id: b.name,
      label: b.name,
      description: this.buildDescription(b),
      disabled: b.current,
      divider: b.remote && i === local.length,
    }));
  });

  onItemSelected(item: CommandPaletteItem): void {
    this.branchSelected.emit(item.id);
  }

  private buildDescription(branch: GitBranchDto): string {
    const { lastCommit } = branch;
    const parts: string[] = [];

    if (branch.current) {
      parts.push('current');
    }

    if (lastCommit?.message) {
      parts.push(lastCommit.author, this.relativeTime(lastCommit.date), lastCommit.message);
    }

    return parts.join(' · ');
  }

  private relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  }
}
