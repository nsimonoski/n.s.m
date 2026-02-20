import { Component } from '@angular/core';
import { MonacoUtils } from '@org/shared/utils';
import { editor } from '@org/angular-data-access';
import { MonacoBaseComponent } from '../monaco-base/monaco-base.component';

@Component({
  selector: 'ide-monaco-editor',
  standalone: true,
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
})
export class MonacoEditorComponent extends MonacoBaseComponent {
  private monacoEditor = new MonacoUtils.MonacoEditorUtils(this.loader);

  protected isReady(): boolean {
    return this.monacoEditor.isReady;
  }

  protected createEditor(container: HTMLElement): void {
    this.monacoEditor.create(container, this.save);
  }

  protected switchToFile(file: editor.OpenFile | null): void {
    this.monacoEditor.switchToFile(file, this.onContentChange);
  }

  ngOnDestroy(): void {
    this.monacoEditor.dispose();
  }

  private save = (): void => {
    const path = this.store.activeFilePath();
    if (path) this.store.saveFile(path);
  };

  private onContentChange = (path: string, value: string): void => {
    this.store.updateContent(path, value);
  };
}
