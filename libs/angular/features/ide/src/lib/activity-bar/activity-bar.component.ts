import { Component, computed, inject } from '@angular/core';
import { ActivityBarConfig } from '@org/shared/utils';
import { IdeStore } from '@org/angular-data-access';

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

  readonly panels = ActivityBarConfig.panels;

  onPanelClick(panelId: string): void {
    this.layoutStore.setActivePanel(panelId);
    if (!this.layoutStore.sidebarOpen()) {
      this.layoutStore.toggleSidebar();
    }
  }
}
