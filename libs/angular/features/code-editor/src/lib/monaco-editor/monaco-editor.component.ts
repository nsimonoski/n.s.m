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
  selector: 'ide-monaco-editor',
  standalone: true,
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
})
export class MonacoEditorComponent implements OnDestroy {
  private readonly store = inject(IdeStore.CodeEditorStore);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('editorContainer');

  constructor() {
    afterNextRender(() => this.init());

    effect(() => {
      const file = this.store.activeFile();
      if (MonacoUtils.editorUtils.isLoaded && MonacoUtils.editorUtils.isReady) {
        MonacoUtils.editorUtils.switchToFile(file, this.onContentChange);
      }
    });
  }

  ngOnDestroy(): void {
    MonacoUtils.editorUtils.dispose();
  }

  private async init(): Promise<void> {
    await MonacoUtils.editorUtils.loadMonaco();
    MonacoUtils.editorUtils.create(this.container().nativeElement, this.save);
    MonacoUtils.editorUtils.switchToFile(this.store.activeFile(), this.onContentChange);
  }

  private save = (): void => {
    const path = this.store.activeFilePath();
    if (path) this.store.saveFile(path);
  };

  private onContentChange = (path: string, value: string): void => {
    this.store.updateContent(path, value);
  };
}
