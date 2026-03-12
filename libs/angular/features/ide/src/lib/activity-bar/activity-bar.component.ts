import { Component, computed, inject } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';

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
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  readonly gitStatusStore = inject(IdeStore.GitStatusStore);

  readonly changeCount = computed(() => this.gitStatusStore.stagedCount() + this.gitStatusStore.changesCount());

  readonly panels: PanelDefinition[] = [
    { id: 'explorer', icon: 'icons/explorer.svg', tooltip: 'Explorer' },
    { id: 'git', icon: 'icons/source-control.svg', tooltip: 'Source Control' },
    { id: 'ai', icon: 'icons/ai.svg', tooltip: 'AI Assistant' },
  ];
}
