import { Component } from '@angular/core';
import { FileExplorerCoreComponent } from '@org/angular-file-explorer-core';
import { CodeEditorComponent } from '@org/angular-code-editor';

@Component({
  selector: 'ide-shell',
  imports: [FileExplorerCoreComponent, CodeEditorComponent],
  templateUrl: './ide-shell.component.html',
  styleUrl: './ide-shell.component.scss',
})
export class IdeShellComponent {}
