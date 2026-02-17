import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import type * as Monaco from 'monaco-editor';
import { editor } from '@org/angular-utils';
import { MonacoLoaderService } from '../services/monaco-loader.service';

@Component({
  selector: 'ide-monaco-editor',
  standalone: true,
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
})
export class MonacoEditorComponent implements OnDestroy {
  private readonly store = inject(editor.EditorStore);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('editorContainer');
  private readonly loader = inject(MonacoLoaderService);

  private monaco: typeof Monaco | null = null;
  private monacoEditor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private models = new Map<string, Monaco.editor.ITextModel>();
  private onDidChangeDisposable: Monaco.IDisposable | null = null;

  constructor() {
    afterNextRender(() => this.initEditor());

    effect(() => {
      const file = this.store.activeFile();
      if (this.monacoEditor && this.monaco) {
        this.switchToFile(file);
      }
    });
  }

  private async initEditor(): Promise<void> {
    this.monaco = await this.loader.loadMonaco();

    this.monacoEditor = this.monaco.editor.create(this.container().nativeElement, {
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      tabSize: 2,
    });

    this.monacoEditor.addCommand(
      this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
      () => {
        const path = this.store.activeFilePath();
        if (path) this.store.saveFile(path);
      },
    );

    this.switchToFile(this.store.activeFile());
  }

  private switchToFile(file: editor.OpenFile | null): void {
    if (!this.monaco || !this.monacoEditor) return;

    this.onDidChangeDisposable?.dispose();
    this.onDidChangeDisposable = null;

    if (!file) {
      this.monacoEditor.setModel(null);
      return;
    }

    let model = this.models.get(file.path);
    if (!model || model.isDisposed()) {
      const uri = this.monaco.Uri.parse(`file://${file.path}`);
      model = this.monaco.editor.createModel(file.currentContent, file.language, uri);
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
