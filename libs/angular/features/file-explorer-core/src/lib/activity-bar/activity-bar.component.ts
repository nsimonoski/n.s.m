import { Component, inject } from '@angular/core';
import { FileExplorerCoreStore } from '../file-explorer-core.store';

interface PanelDefinition {
  id: string;
  icon: string;
  tooltip: string;
}

@Component({
  selector: 'ide-activity-bar',
  standalone: true,
  template: `
    <div class="activity-bar">
      @for (panel of panels; track panel.id) {
        <button
          class="activity-bar-item"
          [class.active]="coreStore.activePanel() === panel.id"
          [title]="panel.tooltip"
          (click)="coreStore.setActivePanel(panel.id)"
        >
          <img class="icon" [src]="panel.icon" [alt]="panel.tooltip" />
        </button>
      }
    </div>
  `,
  styleUrls: ['./activity-bar.component.scss'],
})
export class ActivityBarComponent {
  readonly coreStore = inject(FileExplorerCoreStore);

  readonly panels: PanelDefinition[] = [
    { id: 'explorer', icon: 'icons/explorer.svg', tooltip: 'Explorer' },
    { id: 'git', icon: 'icons/source-control.svg', tooltip: 'Source Control' },
  ];
}
