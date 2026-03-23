import { Component, input, output } from '@angular/core';
import { ActivityBarConfig } from '@org/shared/utils';

@Component({
  selector: 'ide-activity-bar-item',
  standalone: true,
  templateUrl: './activity-bar-item.component.html',
  styleUrls: ['./activity-bar-item.component.scss'],
  host: {
    class: 'activity-bar-item',
    '[class.active]': 'activePanel() === panel().id',
    '[attr.title]': 'panel().tooltip',
    '(click)': 'clicked.emit()',
  },
})
export class ActivityBarItemComponent {
  readonly panel = input.required<ActivityBarConfig.PanelDefinition>();
  readonly activePanel = input<string>();
  readonly clicked = output<void>();
}
