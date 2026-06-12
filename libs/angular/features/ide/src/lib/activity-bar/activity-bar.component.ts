import { Component, computed, inject } from '@angular/core';
import { ActivityBarConfig } from '@org/shared/utils';
import { IdeStore } from '@org/angular-data-access';
import { ActivityBarItemComponent } from './item/activity-bar-item.component';

@Component({
  selector: 'ide-activity-bar',
  standalone: true,
  imports: [ActivityBarItemComponent],
  templateUrl: './activity-bar.component.html',
  styleUrls: ['./activity-bar.component.scss'],
})
export class ActivityBarComponent {
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  readonly gitStatusStore = inject(IdeStore.GitStatusStore);

  readonly changeCount = computed(() => this.gitStatusStore.stagedCount() + this.gitStatusStore.changesCount());

  readonly panels = ActivityBarConfig;

  onPanelClick(panelId: string): void {
    if (this.layoutStore.activePanel() === panelId && this.layoutStore.sidebarOpen()) {
      this.layoutStore.closeSidebar();
    } else {
      this.layoutStore.setActivePanel(panelId);
      if (!this.layoutStore.sidebarOpen()) {
        this.layoutStore.toggleSidebar();
      }
    }
  }
}
