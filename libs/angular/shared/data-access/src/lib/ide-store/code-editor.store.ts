import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { distinctUntilChanged, EMPTY, filter, map, pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { MonacoUtils } from '@org/shared/utils';
import { FileExplorerService } from '../file-explorer.service';
import { FileExplorerWsService } from '../file-explorer-ws.service';

interface State {
  openFiles: MonacoUtils.OpenFile[];
  openFilePaths: string[];
  activeFilePath: string | null;
}

export const CodeEditorStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    openFiles: [],
    openFilePaths: [],
    activeFilePath: null,
  }),
  partialStore.withBrowserStorage({ key: 'editor' }),
  partialStore.withRouting(),
  withProps(() => ({
    service: inject(FileExplorerService),
    wsService: inject(FileExplorerWsService),
  })),
  withComputed((state) => ({
    activeFile: computed(() => {
      const path = state.activeFilePath();
      return state.openFiles().find((f) => f.path === path) ?? null;
    }),
  })),
  withMethods((state) => {
    const syncAfterClose = (files: MonacoUtils.OpenFile[], activePath: string | null) => {
      state.saveToStorage({
        openFilePaths: files.map((f) => f.path),
        activeFilePath: activePath,
      });
      if (activePath) {
        state.navigate('/explorer?filePath=' + encodeURIComponent(activePath));
      } else {
        state.navigate('/explorer');
      }
    };

    return {
      openFile(file: FileResponseDto): void {
        if (state.openFilePaths().includes(file.path)) {
          state.saveToStorage({ activeFilePath: file.path });
          return;
        }

        patchState(state, { openFiles: [...state.openFiles(), MonacoUtils.mapFile(file)] });
        state.saveToStorage({
          openFilePaths: [...state.openFilePaths(), file.path],
          activeFilePath: file.path,
        });
      },

      openDiff(file: FileResponseDto, originalContent: string): void {
        const existing = state.openFiles().find((f) => f.path === file.path && f.mode === 'diff');
        if (existing) {
          patchState(state, { activeFilePath: file.path });
          return;
        }

        const openFile: MonacoUtils.OpenFile = {
          ...MonacoUtils.mapFile(file),
          originalContent,
          mode: 'diff',
        };

        patchState(state, {
          openFiles: [...state.openFiles(), openFile],
          activeFilePath: file.path,
        });
      },

      closeFile(path: string): void {
        const files = state.openFiles().filter((f) => f.path !== path);
        let activePath = state.activeFilePath();

        if (activePath === path) {
          const closedIndex = state.openFiles().findIndex((f) => f.path === path);
          activePath = files[Math.min(closedIndex, files.length - 1)]?.path ?? null;
        }

        patchState(state, { openFiles: files });
        syncAfterClose(files, activePath);
      },

      setActiveFile(path: string): void {
        state.navigate('/explorer?filePath=' + encodeURIComponent(path));
      },

      closeOthers(path: string): void {
        const kept = state.openFiles().filter((f) => f.path === path);
        patchState(state, { openFiles: kept });
        syncAfterClose(kept, path);
      },

      closeAll(): void {
        patchState(state, { openFiles: [] });
        syncAfterClose([], null);
      },

      closeSaved(): void {
        const dirty = state.openFiles().filter((f) => f.isDirty);
        const activePath = state.activeFilePath();
        const activeStillOpen = dirty.some((f) => f.path === activePath);
        const newActivePath = activeStillOpen ? activePath : (dirty[0]?.path ?? null);

        patchState(state, { openFiles: dirty });
        syncAfterClose(dirty, newActivePath);
      },

      closeToTheRight(path: string): void {
        const idx = state.openFiles().findIndex((f) => f.path === path);
        const kept = state.openFiles().slice(0, idx + 1);
        const activePath = state.activeFilePath();
        const activeStillOpen = kept.some((f) => f.path === activePath);
        const newActivePath = activeStillOpen ? activePath : path;

        patchState(state, { openFiles: kept });
        syncAfterClose(kept, newActivePath);
      },

      updateContent(path: string, content: string): void {
        patchState(state, {
          openFiles: state
            .openFiles()
            .map((f) =>
              f.path === path
                ? { ...f, currentContent: content, isDirty: content !== f.content }
                : f,
            ),
        });
      },

      saveFile: rxMethod<string>(
        pipe(
          switchMap((path: string) => {
            const file = state.openFiles().find((f) => f.path === path);
            if (!file) return EMPTY;

            return state.service
              .updateFile({
                name: file.name,
                path: file.path,
                content: file.currentContent,
                type: file.type,
              } as FileResponseDto)
              .pipe(
                tap((saved) => {
                  patchState(state, {
                    openFiles: state.openFiles().map((f) =>
                      f.path === saved.path
                        ? {
                            ...f,
                            content: saved.content ?? f.currentContent,
                            currentContent: saved.content ?? f.currentContent,
                            isDirty: false,
                            updatedAt: saved.updatedAt,
                          }
                        : f,
                    ),
                  });
                }),
              );
          }),
        ),
      ),
    };
  }),
  withMethods((state) => ({
    restoreOpenFiles: rxMethod<void>(
      pipe(
        switchMap(() => {
          const paths = state.openFilePaths();
          if (paths.length === 0) return EMPTY;
          return state.service.getFiles(paths).pipe(map((files) => ({ paths, files })));
        }),
        tap(({ paths, files }) => {
          const activePath = state.activeFilePath() ?? paths[0];
          const fileMap = new Map(files.map((f) => [f.path, f]));
          const openFiles = paths
            .map((path) => fileMap.get(path))
            .filter((f): f is FileResponseDto => !!f)
            .map(MonacoUtils.mapFile);

          patchState(state, { openFiles });
          if (activePath) {
            state.saveToStorage({ activeFilePath: activePath });
            if (state.currentUrl().startsWith('/explorer')) {
              state.navigate('/explorer?filePath=' + encodeURIComponent(activePath));
            }
          }
        }),
      ),
    ),
    listenToFileChanges: rxMethod<void>(
      pipe(
        switchMap(() => state.wsService.fileChanges$),
        filter((event) => event.type === 'change'),
        filter((event) => state.openFiles().some((f) => f.path === event.path)),
        switchMap((event) => state.service.getFile(event.path)),
        tap((file) => {
          const mapped = MonacoUtils.mapFile(file);
          patchState(state, {
            openFiles: state
              .openFiles()
              .map((f) => (f.path === file.path ? { ...f, ...mapped } : f)),
          });
        }),
      ),
    ),
    listenToFileOpen: rxMethod<void>(
      pipe(
        switchMap(() =>
          state.navigationEnd$.pipe(
            map((event) =>
              new URL(event.urlAfterRedirects, location.origin).searchParams.get('filePath'),
            ),
            filter((filePath): filePath is string => !!filePath),
            distinctUntilChanged(),
          ),
        ),
        switchMap((filePath) => {
          const existing = state.openFiles().find((f) => f.path === filePath);
          if (existing) {
            state.saveToStorage({ activeFilePath: filePath });
            return [];
          }
          return state.service.getFile(filePath).pipe(tap((file) => state.openFile(file)));
        }),
      ),
    ),
  })),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.restoreOpenFiles();
      state.listenToFileChanges();
      state.listenToFileOpen();
    },
  }),
);
