import { Component, inject } from '@angular/core';
import { FileExplorerGitStore } from '@org/angular-file-explorer-git';

@Component({
  selector: 'ide-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly gitStore = inject(FileExplorerGitStore);
}
