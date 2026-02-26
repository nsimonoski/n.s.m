import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { IdeStore } from '@org/angular-data-access';
import { MonacoUtils } from '@org/shared/utils';

@Component({
  selector: 'ide-monaco-diff-editor',
  standalone: true,
  templateUrl: './monaco-diff-editor.component.html',
  styleUrls: ['./monaco-diff-editor.component.scss'],
})
export class MonacoDiffEditorComponent implements OnDestroy {
  private readonly store = inject(IdeStore.CodeEditorStore);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('editorContainer');

  constructor() {
    afterNextRender(() => this.init());

    effect(() => {
      const file = this.store.activeFile();
      if (MonacoUtils.editorUtils.isLoaded && MonacoUtils.diffEditorUtils.isReady) {
        MonacoUtils.diffEditorUtils.switchToFile(file);
      }
    });
  }

  ngOnDestroy(): void {
    MonacoUtils.diffEditorUtils.dispose();
  }

  private async init(): Promise<void> {
    await MonacoUtils.editorUtils.loadMonaco();
    MonacoUtils.diffEditorUtils.create(this.container().nativeElement);
    MonacoUtils.diffEditorUtils.switchToFile(this.store.activeFile());
  }
}
