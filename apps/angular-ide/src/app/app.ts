import { Component } from '@angular/core';

import { AngularFileExplorerComponent } from '@org/angular-file-explorer';

@Component({
  imports: [AngularFileExplorerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
