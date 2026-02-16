import { Component, input, output } from '@angular/core';

export interface NodeAction {
  id: string;
  icon: string;
  tooltip?: string;
}

@Component({
  selector: 'ui-file-tree-node-action',
  standalone: true,
  templateUrl: './file-tree-node-action.component.html',
  styleUrls: ['./file-tree-node-action.component.scss'],
})
export class FileTreeNodeActionComponent {
  actions = input.required<NodeAction[]>();
  actionClicked = output<string>();

  onClick(event: MouseEvent, actionId: string): void {
    event.stopPropagation();
    this.actionClicked.emit(actionId);
  }
}
