import { Component, inject } from '@angular/core';
import { AngularFileExplorerGitStore } from '@org/angular-file-explorer-git';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly gitStore = inject(AngularFileExplorerGitStore);
}
