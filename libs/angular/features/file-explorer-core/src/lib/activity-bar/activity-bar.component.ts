import { Component, computed, inject } from '@angular/core';
import { FileExplorerCoreStore } from '../file-explorer-core.store';

interface PanelDefinition {
  id: string;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'ide-activity-bar',
  standalone: true,
  templateUrl: './activity-bar.component.html',
  styleUrls: ['./activity-bar.component.scss'],
})
export class ActivityBarComponent {
  readonly coreStore = inject(FileExplorerCoreStore);

  readonly changeCount = computed(() => this.coreStore.stagedCount() + this.coreStore.changesCount());

  readonly panels: PanelDefinition[] = [
    { id: 'explorer', icon: 'icons/explorer.svg', tooltip: 'Explorer' },
    { id: 'git', icon: 'icons/source-control.svg', tooltip: 'Source Control' },
  ];
}
