import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { FileResponseDto } from '@org/shared/contracts';
import { FileExplorerService } from '@org/angular-data-access';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

@Component({
  selector: 'ui-go-to-file',
  standalone: true,
  templateUrl: './go-to-file.component.html',
  styleUrls: ['./go-to-file.component.scss'],
})
export class GoToFileComponent implements OnInit, OnDestroy {
  readonly fileSelected = output<FileResponseDto>();
  readonly closed = output<void>();

  readonly query = signal('');
  readonly results = signal<FileResponseDto[]>([]);
  readonly activeIndex = signal(0);
  readonly loading = signal(false);

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly fileService = inject(FileExplorerService);

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.loading.set(false);
            return of([]);
          }
          this.loading.set(true);
          return this.fileService.searchFiles(query, ROOT_PATH);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.activeIndex.set(0);
        this.loading.set(false);
      });

    setTimeout(() => this.searchInput()?.nativeElement.focus());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  onKeydown(event: KeyboardEvent): void {
    const results = this.results();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (results.length > 0) {
          this.selectFile(results[this.activeIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
    }
  }

  selectFile(file: FileResponseDto): void {
    this.fileSelected.emit(file);
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
