import { Component } from '@angular/core';

import { FileExplorerCoreComponent } from '@org/angular-file-explorer-core';
import { CodeEditorComponent } from '@org/angular-code-editor';

@Component({
  imports: [FileExplorerCoreComponent, CodeEditorComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
