import { Component, computed, inject, OnDestroy, output } from '@angular/core';
import { FileResponseDto } from '@org/shared/contracts';
import { CommandPaletteComponent, CommandPaletteItem } from '@org/angular/ui';
import { FileExplorerCoreStore } from '../file-explorer-core.store';

@Component({
  selector: 'ide-file-picker',
  standalone: true,
  imports: [CommandPaletteComponent],
  templateUrl: './file-picker.component.html',
})
export class FilePickerComponent implements OnDestroy {
  readonly fileSelected = output<FileResponseDto>();
  readonly closed = output<void>();

  private readonly store = inject(FileExplorerCoreStore);

  readonly loading = this.store.searchLoading;
  readonly items = computed<CommandPaletteItem[]>(() =>
    this.store.searchResults().map((file) => ({
      id: file.path,
      label: file.name,
      description: file.path,
    })),
  );

  onSearchChanged(query: string): void {
    if (!query.trim()) {
      this.store.clearSearchResults();
      return;
    }
    this.store.searchFiles(query);
  }

  onItemSelected(item: CommandPaletteItem): void {
    const file = this.store.searchResults().find((f) => f.path === item.id);
    if (file) {
      this.fileSelected.emit(file);
    }
  }

  ngOnDestroy(): void {
    this.store.clearSearchResults();
  }
}
