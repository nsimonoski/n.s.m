import { Component, inject, OnInit } from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { TabBarComponent } from './tab-bar/tab-bar.component';
import { MonacoEditorComponent } from './monaco-editor/monaco-editor.component';
import { MonacoDiffEditorComponent } from './monaco-diff-editor/monaco-diff-editor.component';

@Component({
  selector: 'ide-code-editor',
  standalone: true,
  imports: [TabBarComponent, MonacoEditorComponent, MonacoDiffEditorComponent],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements OnInit {
  readonly store = inject(IdeStore.CodeEditorStore);

  ngOnInit(): void {
    this.store.initialize();
  }
}
