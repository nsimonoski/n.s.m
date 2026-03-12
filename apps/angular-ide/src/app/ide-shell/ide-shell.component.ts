import { Component, inject } from '@angular/core';
import { IdeLayoutComponent } from '@org/angular-ide';
import { CodeEditorComponent } from '@org/angular-code-editor';
import { IdeStore } from '@org/angular-data-access';

@Component({
  selector: 'ide-shell',
  imports: [IdeLayoutComponent, CodeEditorComponent],
  templateUrl: './ide-shell.component.html',
  styleUrl: './ide-shell.component.scss',
})
export class IdeShellComponent {
  private readonly deploymentVersionStore = inject(IdeStore.DeploymentVersionStore);
}
