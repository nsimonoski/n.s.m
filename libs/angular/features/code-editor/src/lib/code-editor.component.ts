import { Component, inject } from '@angular/core';
import { editor } from '@org/angular-utils';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { MonacoEditorComponent } from './monaco-editor/monaco-editor.component';

@Component({
  selector: 'ide-code-editor',
  standalone: true,
  imports: [TabBarComponent, MonacoEditorComponent],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent {
  readonly store = inject(editor.EditorStore);
}
