import {
  Directive,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { editor } from '@org/angular-utils';
import { MonacoService } from '../services/monaco.service';

@Directive()
export abstract class MonacoBaseComponent implements OnDestroy {
  protected readonly store = inject(editor.EditorStore);
  protected readonly container = viewChild.required<ElementRef<HTMLElement>>('editorContainer');
  protected readonly loader = inject(MonacoService);

  constructor() {
    afterNextRender(() => this.init());

    effect(() => {
      const file = this.store.activeFile();
      if (this.loader.isLoaded && this.isReady()) {
        this.switchToFile(file);
      }
    });
  }

  private async init(): Promise<void> {
    await this.loader.loadMonaco();
    this.createEditor(this.container().nativeElement);
    this.switchToFile(this.store.activeFile());
  }

  protected abstract isReady(): boolean;
  protected abstract createEditor(container: HTMLElement): void;
  protected abstract switchToFile(file: editor.OpenFile | null): void;
  abstract ngOnDestroy(): void;
}
