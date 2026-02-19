import { Component, input, linkedSignal, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { CommandPaletteItem } from './command-palette.model';

@Component({
  selector: 'ui-command-palette',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
})
export class CommandPaletteComponent {
  items = input.required<CommandPaletteItem[]>();
  placeholder = input('Search...');
  loading = input(false);

  itemSelected = output<CommandPaletteItem>();
  searchChanged = output<string>();
  closed = output<void>();

  readonly searchControl = new FormControl('');
  readonly activeIndex = signal(0);
  readonly filteredItems = linkedSignal(() => this.items());

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        tap((value) => {
          const q = (value ?? '').toLowerCase();
          this.activeIndex.set(0);
          this.filteredItems.set(
            this.items().filter((item) => item.label.toLowerCase().includes(q)),
          );
        }),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => this.searchChanged.emit(value ?? ''));
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.filteredItems();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (items.length > 0) {
          const item = items[this.activeIndex()];
          if (!item.disabled) {
            this.itemSelected.emit(item);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
    }
  }

  selectItem(item: CommandPaletteItem): void {
    if (!item.disabled) {
      this.itemSelected.emit(item);
    }
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
