import { MonacoUtils, BASE_EDITOR_OPTIONS } from './monaco.utils';
import type { CodeEditor, TextModel, Disposable } from './monaco.utils';
import type { MonacoFile } from './monaco-diff-editor.utils';

export class MonacoEditorUtils {
  private editor: CodeEditor | null = null;
  private models = new Map<string, TextModel>();
  private onDidChangeDisposable: Disposable | null = null;

  constructor(private readonly loader: MonacoUtils) {}

  get instance(): CodeEditor | null {
    return this.editor;
  }

  get isReady(): boolean {
    return !!this.editor;
  }

  create(container: HTMLElement, onSave?: () => void): void {
    this.editor = this.loader.createEditor(container, {
      ...BASE_EDITOR_OPTIONS,
      minimap: { enabled: true },
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
    });

    if (onSave) {
      this.editor.addCommand(
        this.loader.getKeyMod().CtrlCmd | this.loader.getKeyCode().KeyS,
        onSave,
      );
    }
  }

  switchToFile(file: MonacoFile | null, onContentChange?: (path: string, value: string) => void): void {
    if (!this.editor) return;

    this.onDidChangeDisposable?.dispose();
    this.onDidChangeDisposable = null;

    if (!file) {
      this.editor.setModel(null);
      return;
    }

    let model = this.models.get(file.path);
    if (!model || model.isDisposed()) {
      const uri = this.loader.parseUri(`file://${file.path}`);
      model = this.loader.createModel(file.currentContent, file.language, uri);
      this.models.set(file.path, model);
    } else if (model.getValue() !== file.currentContent) {
      model.setValue(file.currentContent);
    }

    this.editor.setModel(model);

    if (onContentChange) {
      const currentModel = model;
      this.onDidChangeDisposable = currentModel.onDidChangeContent(() => {
        onContentChange(file.path, currentModel.getValue());
      });
    }
  }

  dispose(): void {
    this.onDidChangeDisposable?.dispose();
    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.editor?.dispose();
    this.editor = null;
  }
}
