import { Component, inject } from '@angular/core';
import { FileExplorerCoreComponent } from '@org/angular-file-explorer-core';
import { CodeEditorComponent } from '@org/angular-code-editor';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-shell',
  imports: [FileExplorerCoreComponent, CodeEditorComponent],
  templateUrl: './ide-shell.component.html',
  styleUrl: './ide-shell.component.scss',
})
export class IdeShellComponent {
  private readonly deploymentVersionStore = inject(IdeStore.DeploymentVersionStore);
}
