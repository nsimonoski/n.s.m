import { Component } from '@angular/core';
import { MonacoUtils } from '@org/shared/utils';
import { editor } from '@org/angular-data-access';
import { MonacoBaseComponent } from '../monaco-base/monaco-base.component';

@Component({
  selector: 'ide-monaco-diff-editor',
  standalone: true,
  templateUrl: './monaco-diff-editor.component.html',
  styleUrls: ['./monaco-diff-editor.component.scss'],
})
export class MonacoDiffEditorComponent extends MonacoBaseComponent {
  private diffEditor = new MonacoUtils.MonacoDiffEditorUtils(this.loader);

  protected isReady(): boolean {
    return this.diffEditor.isReady;
  }

  protected createEditor(container: HTMLElement): void {
    this.diffEditor.create(container);
  }

  protected switchToFile(file: editor.OpenFile | null): void {
    this.diffEditor.switchToFile(file);
  }

  ngOnDestroy(): void {
    this.diffEditor.dispose();
  }
}
