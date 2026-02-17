import { Component } from '@angular/core';
import { MonacoUtils } from '@org/shared/utils';
import { editor } from '@org/angular-utils';
import { MonacoBaseComponent } from '../monaco-base/monaco-base.component';

@Component({
  selector: 'ide-monaco-diff-editor',
  standalone: true,
  templateUrl: './monaco-diff-editor.component.html',
  styleUrls: ['./monaco-diff-editor.component.scss'],
})
export class MonacoDiffEditorComponent extends MonacoBaseComponent {
  private diffEditor: MonacoUtils.DiffEditor | null = null;

  protected isReady(): boolean {
    return !!this.diffEditor;
  }

  protected createEditor(container: HTMLElement): void {
    this.diffEditor = this.loader.createDiffEditor(container, {
      ...MonacoUtils.BASE_EDITOR_OPTIONS,
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
    });
  }

  protected switchToFile(file: editor.OpenFile | null): void {
    if (!this.diffEditor) return;

    if (!file || file.mode !== 'diff') return;

    const previousModel = this.diffEditor.getModel();

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

    this.diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    previousModel?.original?.dispose();
    previousModel?.modified?.dispose();
  }

  ngOnDestroy(): void {
    const model = this.diffEditor?.getModel();
    model?.original?.dispose();
    model?.modified?.dispose();
    this.diffEditor?.dispose();
  }
}
