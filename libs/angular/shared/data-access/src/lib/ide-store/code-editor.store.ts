import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { distinctUntilChanged, EMPTY, filter, map, pipe, switchMap, tap } from 'rxjs';
import { FileResponseDto } from '@org/shared/contracts';
import { partialStore } from '@org/angular-utils';
import { AppRoutes, MonacoUtils } from '@org/shared/utils';
import { FileExplorerService } from '../file-explorer.service';
import { FileExplorerWsService } from '../file-explorer-ws.service';

interface State {
  openFiles: MonacoUtils.OpenFile[];
  openFilePaths: string[];
  activeTabId: string | null;
}

export const CodeEditorStore = signalStore(
  { providedIn: 'root' },
  withState<State>({
    openFiles: [],
    openFilePaths: [],
    activeTabId: null,
  }),
  partialStore.withBrowserStorage({ key: 'editor' }),
  partialStore.withRouting(),
  withProps(() => ({
    service: inject(FileExplorerService),
    wsService: inject(FileExplorerWsService),
  })),
  withComputed((state) => ({
    activeFile: computed(() => {
      const tabId = state.activeTabId();
      return state.openFiles().find((f) => f.tabId === tabId) ?? null;
    }),
  })),
  withMethods((state) => {
    const syncAfterClose = (files: MonacoUtils.OpenFile[], activeTabId: string | null) => {
      state.saveToStorage({
        openFilePaths: files.filter((f) => f.mode === 'regular').map((f) => f.path),
        activeTabId,
      });
      const activePath = files.find((f) => f.tabId === activeTabId)?.path ?? null;
      const currentUrl = state.currentUrl();
      if (activePath) {
        state.navigate(AppRoutes.ide.withFile(currentUrl, activePath));
      } else {
        state.navigate(currentUrl.split('?')[0]);
      }
    };

    return {
      openFile(file: FileResponseDto): void {
        const tabId = MonacoUtils.createTabId(file.path, 'regular');
        const existing = state.openFiles().find((f) => f.tabId === tabId);
        if (existing) {
          state.saveToStorage({ activeTabId: tabId });
          return;
        }

        patchState(state, { openFiles: [...state.openFiles(), MonacoUtils.mapFile(file)] });
        state.saveToStorage({
          openFilePaths: [...state.openFilePaths(), file.path],
          activeTabId: tabId,
        });
      },

      openDiff(file: FileResponseDto, originalContent: string): void {
        const tabId = MonacoUtils.createTabId(file.path, 'diff');
        const existing = state.openFiles().find((f) => f.tabId === tabId);
        if (existing) {
          patchState(state, { activeTabId: tabId });
          return;
        }

        const openFile: MonacoUtils.OpenFile = {
          ...MonacoUtils.mapFile(file),
          tabId,
          originalContent,
          mode: 'diff',
        };

        patchState(state, {
          openFiles: [...state.openFiles(), openFile],
          activeTabId: tabId,
        });
      },

      closeFile(tabId: string): void {
        const files = state.openFiles().filter((f) => f.tabId !== tabId);
        let activeTabId = state.activeTabId();

        if (activeTabId === tabId) {
          const closedIndex = state.openFiles().findIndex((f) => f.tabId === tabId);
          activeTabId = files[Math.min(closedIndex, files.length - 1)]?.tabId ?? null;
        }

        patchState(state, { openFiles: files });
        syncAfterClose(files, activeTabId);
      },

      setActiveFile(tabId: string): void {
        const file = state.openFiles().find((f) => f.tabId === tabId);
        if (file) {
          const currentUrl = state.currentUrl();
          if (currentUrl.startsWith(AppRoutes.ide.root)) {
            state.navigate(AppRoutes.ide.withFile(currentUrl, file.path));
          }
          patchState(state, { activeTabId: tabId });
        }
      },

      closeOthers(tabId: string): void {
        const kept = state.openFiles().filter((f) => f.tabId === tabId);
        patchState(state, { openFiles: kept });
        syncAfterClose(kept, tabId);
      },

      closeAll(): void {
        patchState(state, { openFiles: [] });
        syncAfterClose([], null);
      },

      closeSaved(): void {
        const dirty = state.openFiles().filter((f) => f.isDirty);
        const activeTabId = state.activeTabId();
        const activeStillOpen = dirty.some((f) => f.tabId === activeTabId);
        const newActiveTabId = activeStillOpen ? activeTabId : (dirty[0]?.tabId ?? null);

        patchState(state, { openFiles: dirty });
        syncAfterClose(dirty, newActiveTabId);
      },

      closeToTheRight(tabId: string): void {
        const idx = state.openFiles().findIndex((f) => f.tabId === tabId);
        const kept = state.openFiles().slice(0, idx + 1);
        const activeTabId = state.activeTabId();
        const activeStillOpen = kept.some((f) => f.tabId === activeTabId);
        const newActiveTabId = activeStillOpen ? activeTabId : tabId;

        patchState(state, { openFiles: kept });
        syncAfterClose(kept, newActiveTabId);
      },

      updateContent(path: string, content: string): void {
        patchState(state, {
          openFiles: state
            .openFiles()
            .map((f) =>
              f.path === path && f.mode === 'regular'
                ? { ...f, currentContent: content, isDirty: content !== f.content }
                : f,
            ),
        });
      },

      saveFile: rxMethod<string>(
        pipe(
          switchMap((path: string) => {
            const file = state.openFiles().find((f) => f.path === path && f.mode === 'regular');
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
                      f.path === saved.path && f.mode === 'regular'
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
          const fileMap = new Map(files.map((f) => [f.path, f]));
          const openFiles = paths
            .map((path) => fileMap.get(path))
            .filter((f): f is FileResponseDto => !!f)
            .map(MonacoUtils.mapFile);

          patchState(state, { openFiles });

          const storedTabId = state.activeTabId();
          const activeTabId = storedTabId ?? (openFiles[0]?.tabId ?? null);
          if (activeTabId) {
            const activeFile = openFiles.find((f) => f.tabId === activeTabId);
            state.saveToStorage({ activeTabId });
            if (activeFile && state.currentUrl().startsWith(AppRoutes.ide.root)) {
              state.navigate(AppRoutes.ide.withFile(state.currentUrl(), activeFile.path));
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
              .map((f) =>
                f.path === file.path && f.mode === 'regular' ? { ...f, ...mapped } : f,
              ),
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
          const tabId = MonacoUtils.createTabId(filePath, 'regular');
          const existing = state.openFiles().find((f) => f.tabId === tabId);
          if (existing) {
            state.saveToStorage({ activeTabId: tabId });
            return [];
          }
          return state.service.getFile(filePath).pipe(tap((file) => state.openFile(file)));
        }),
      ),
    ),
  })),
  withMethods((state) => ({
    initialize(): void {
      state.loadFromStorage();
      state.restoreOpenFiles();
      state.listenToFileChanges();
      state.listenToFileOpen();
    },
  })),
);
