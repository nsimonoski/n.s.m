import { BASE_EDITOR_OPTIONS, MonacoUtils } from './monaco.utils';
import type { DiffEditor } from './monaco.utils';
import type { File } from './monaco.contract';

export class MonacoDiffEditorUtils {
  private editor: DiffEditor | null = null;

  constructor(private readonly loader: MonacoUtils) {}

  get instance(): DiffEditor | null {
    return this.editor;
  }

  get isReady(): boolean {
    return !!this.editor;
  }

  create(container: HTMLElement): void {
    this.editor = this.loader.createDiffEditor(container, {
      ...BASE_EDITOR_OPTIONS,
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
    });
  }

  switchToFile(file: File | null): void {
    if (!this.editor) return;
    if (!file || file.mode !== 'diff') return;

    const previousModel = this.editor.getModel();

    const originalModel = this.loader.createModel(
      file.originalContent,
      file.language,
      this.loader.parseUri(`diff-original://${file.path}`),
    );

    const modifiedModel = this.loader.createModel(
      file.currentContent,
      file.language,
      this.loader.parseUri(`diff-modified://${file.path}`),
    );

    this.editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    previousModel?.original?.dispose();
    previousModel?.modified?.dispose();
  }

  dispose(): void {
    const model = this.editor?.getModel();
    model?.original?.dispose();
    model?.modified?.dispose();
    this.editor?.dispose();
    this.editor = null;
  }
}
