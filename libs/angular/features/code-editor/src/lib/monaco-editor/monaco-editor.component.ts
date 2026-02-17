import { Component } from '@angular/core';
import { MonacoUtils } from '@org/shared/utils';
import { editor } from '@org/angular-utils';
import { MonacoBaseComponent } from '../monaco-base/monaco-base.component';

@Component({
  selector: 'ide-monaco-editor',
  standalone: true,
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
})
export class MonacoEditorComponent extends MonacoBaseComponent {
  private monacoEditor: MonacoUtils.CodeEditor | null = null;
  private models = new Map<string, MonacoUtils.TextModel>();
  private onDidChangeDisposable: MonacoUtils.Disposable | null = null;

  protected isReady(): boolean {
    return !!this.monacoEditor;
  }

  protected createEditor(container: HTMLElement): void {
    this.monacoEditor = this.loader.createEditor(container, {
      ...MonacoUtils.BASE_EDITOR_OPTIONS,
      minimap: { enabled: true },
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
    });

    this.monacoEditor.addCommand(
      this.loader.getKeyMod().CtrlCmd | this.loader.getKeyCode().KeyS,
      () => {
        const path = this.store.activeFilePath();
        if (path) this.store.saveFile(path);
      },
    );
  }

  protected switchToFile(file: editor.OpenFile | null): void {
    if (!this.monacoEditor) return;

    this.onDidChangeDisposable?.dispose();
    this.onDidChangeDisposable = null;

    if (!file) {
      this.monacoEditor.setModel(null);
      return;
    }

    let model = this.models.get(file.path);
    if (!model || model.isDisposed()) {
      const uri = this.loader.parseUri(`file://${file.path}`);
      model = this.loader.createModel(file.currentContent, file.language, uri);
      this.models.set(file.path, model);
    }

    this.monacoEditor.setModel(model);

    this.onDidChangeDisposable = model.onDidChangeContent(() => {
      this.store.updateContent(file.path, model!.getValue());
    });
  }

  ngOnDestroy(): void {
    this.onDidChangeDisposable?.dispose();
    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.monacoEditor?.dispose();
  }
}
