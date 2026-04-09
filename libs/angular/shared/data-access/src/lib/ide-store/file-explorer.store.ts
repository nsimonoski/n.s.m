import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';

import {
  DirectoryResponseDto,
  FILE_CHANGE_EVENT,
  FILE_WATCH_EVENT,
  FileChangeEvent,
  FileResponseDto,
  RenameRequestDto,
} from '@org/shared/contracts';
import { AppRoutes, FileUtils } from '@org/shared/utils';
import { partialStore, sockets } from '@org/angular-utils';
import { EMPTY, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { FileExplorerService } from '../file-explorer.service';
import { AuthStore } from './auth.store';

interface FileExplorerComponentState {
  rootPath: string;
  directory: DirectoryResponseDto | null;
  file: FileResponseDto | null;
  loading: boolean;
}

export const FileExplorerStore = signalStore(
  { providedIn: 'root' },
  withState<FileExplorerComponentState>({
    rootPath: '',
    directory: null,
    file: null,
    loading: false,
  }),
  partialStore.withLoading(),
  partialStore.withDialog(),
  partialStore.withRouting(),
  withProps(() => ({
    authStore: inject(AuthStore),
    service: inject(FileExplorerService),
    ws: inject(sockets.SocketService),
  })),
  withMethods((state) => {
    const refreshParentDirectory = rxMethod<string>(
      pipe(
        switchMap((childPath: string) => {
          const parentPath = childPath.substring(0, childPath.lastIndexOf('/'));
          const targetPath = parentPath || state.directory()?.path;
          if (!targetPath || !state.directory()) {
            return EMPTY;
          }

          return state.service.readDirectory(targetPath).pipe(
            tap(({ success, data }) => {
              const currentDir = state.directory();
              if (!success || !currentDir) return;
              patchState(state, {
                directory: FileUtils.refreshDirectoryInTree(currentDir, targetPath, data),
              });
            }),
          );
        }),
      ),
    );

    return {
      refreshParentDirectory,
      navigateToFile: (filePath: string) => {
        state.navigate(AppRoutes.ide.explorerWithFile(filePath));
      },
      revealFile: async (
        filePath: string,
      ): Promise<{ ancestors: string[]; filePath: string } | null> => {
        const rootPath = state.directory()?.path;
        if (!rootPath) return null;

        const ancestors = FileUtils.getAncestorPaths(rootPath, filePath);

        for (const dirPath of ancestors) {
          const currentDir = state.directory();
          if (!currentDir || !FileUtils.isDirectoryLoaded(currentDir, dirPath)) {
            const { success, data } = await firstValueFrom(state.service.readDirectory(dirPath));
            const dirAfterFetch = state.directory();
            if (success && dirAfterFetch) {
              patchState(state, {
                directory: FileUtils.mergeDirectoryIntoTree(dirAfterFetch, data.path, data),
              });
            }
          }
        }

        return { ancestors, filePath };
      },
      getDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.readDirectory(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            patchState(state, { directory: data });
          }),
        ),
      ),
      expandDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.readDirectory(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            const currentDir = state.directory();
            if (!success || !currentDir) return;
            patchState(state, {
              directory: FileUtils.mergeDirectoryIntoTree(currentDir, data.path, data),
            });
          }),
        ),
      ),
      getFile: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.getFile(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            patchState(state, { file: data });
          }),
        ),
      ),
      rename: rxMethod<RenameRequestDto>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((payload: RenameRequestDto) => state.service.rename(payload)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            refreshParentDirectory(data.path);
          }),
        ),
      ),
      createFile: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.createFile(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            patchState(state, { file: data });
            refreshParentDirectory(data.path);
          }),
        ),
      ),
      createDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.createDirectory(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            refreshParentDirectory(data.path);
          }),
        ),
      ),
      delete: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.delete(path)),
          tap(({ success, data }) => {
            state.setLoading(false);
            if (!success) return;
            refreshParentDirectory(data.path);
          }),
        ),
      ),
      listenToFileChanges: rxMethod<void>(
        pipe(
          switchMap(() => state.ws.on<FileChangeEvent>(FILE_CHANGE_EVENT)),
          tap((event) => refreshParentDirectory(event.path)),
        ),
      ),
    };
  }),
  withHooks({
    onInit(state) {
      const rootPath = state.authStore.workspace()?.rootPath ?? '';
      patchState(state, { rootPath });
      state.getDirectory(rootPath);
      state.ws.watch(FILE_WATCH_EVENT, rootPath);
      state.listenToFileChanges();
    },
  }),
);
