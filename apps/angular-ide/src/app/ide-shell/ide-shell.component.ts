import { Component, inject } from '@angular/core';
import { IdeLayoutComponent } from '@org/angular-ide';
import { CodeEditorComponent } from '@org/angular-code-editor';
import { TerminalPanelComponent } from '@org/angular-terminal';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-shell',
  imports: [IdeLayoutComponent, CodeEditorComponent, TerminalPanelComponent],
  templateUrl: './ide-shell.component.html',
  styleUrl: './ide-shell.component.scss',
})
export class IdeShellComponent {
  readonly layoutStore = inject(IdeStore.IdeLayoutStore);
  private readonly deploymentVersionStore = inject(IdeStore.DeploymentVersionStore);
}
