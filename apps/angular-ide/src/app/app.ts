import { Component } from '@angular/core';

import { FileExplorerCoreComponent } from '@org/angular-file-explorer-core';

@Component({
  imports: [FileExplorerCoreComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
