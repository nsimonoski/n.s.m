import type * as Monaco from 'monaco-editor';

export type CodeEditor = Monaco.editor.IStandaloneCodeEditor;
export type DiffEditor = Monaco.editor.IStandaloneDiffEditor;
export type TextModel = Monaco.editor.ITextModel;
export type EditorOptions = Monaco.editor.IStandaloneEditorConstructionOptions;
export type DiffEditorOptions = Monaco.editor.IStandaloneDiffEditorConstructionOptions;
export type Disposable = Monaco.IDisposable;

export const BASE_EDITOR_OPTIONS: EditorOptions = {
  theme: 'vs-dark',
  automaticLayout: true,
  fontSize: 13,
  scrollBeyondLastLine: false,
};

export class MonacoService {
  protected _monaco: typeof Monaco | null = null;
  private _loading: Promise<typeof Monaco> | null = null;

  get isLoaded(): boolean {
    return !!this._monaco;
  }

  async loadMonaco(): Promise<typeof Monaco> {
    if (this._monaco) return this._monaco;
    if (this._loading) return this._loading;

    this._loading = this.load();
    return this._loading;
  }

  createEditor(container: HTMLElement, options: EditorOptions): CodeEditor {
    return this.monaco.editor.create(container, options);
  }

  createDiffEditor(container: HTMLElement, options: DiffEditorOptions): DiffEditor {
    return this.monaco.editor.createDiffEditor(container, options);
  }

  createModel(value: string, language?: string, uri?: Monaco.Uri): TextModel {
    return this.monaco.editor.createModel(value, language, uri);
  }

  parseUri(uri: string): Monaco.Uri {
    return this.monaco.Uri.parse(uri);
  }

  getKeyMod(): typeof Monaco.KeyMod {
    return this.monaco.KeyMod;
  }

  getKeyCode(): typeof Monaco.KeyCode {
    return this.monaco.KeyCode;
  }

  private get monaco(): typeof Monaco {
    if (!this._monaco) {
      throw new Error('Monaco is not loaded yet. Call loadMonaco() first.');
    }
    return this._monaco;
  }

  private load(): Promise<typeof Monaco> {
    return new Promise((resolve, reject) => {
      const baseUrl = 'monaco-editor/min/vs';

      const script = document.createElement('script');
      script.src = `${baseUrl}/loader.js`;
      script.onload = () => {
        const win = window as unknown as Record<string, unknown>;
        const amdRequire = win['require'] as {
          config: (opts: { paths: Record<string, string> }) => void;
          (deps: string[], callback: () => void): void;
        };

        amdRequire.config({ paths: { vs: baseUrl } });
        amdRequire(['vs/editor/editor.main'], () => {
          this._monaco = win['monaco'] as typeof Monaco;
          resolve(this._monaco);
        });
      };
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }
}
