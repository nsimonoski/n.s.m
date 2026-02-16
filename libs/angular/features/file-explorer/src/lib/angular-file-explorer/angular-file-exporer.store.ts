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

import { DirectoryResponseDto, FileResponseDto, RenameRequestDto } from '@org/shared/contracts';
import { FileExplorerService } from '../data-access/services/file-explorer.service';
import { FileExplorerWsService } from '../data-access/services/file-explorer-ws.service';
import { pipe, switchMap, tap } from 'rxjs';
import { partialStore } from '@org/angular-utils';

interface FileExplorerComponentState {
  directory: DirectoryResponseDto | null;
  file: FileResponseDto | null;
  loading: boolean;
}

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

function mergeDirectoryIntoTree(
  root: DirectoryResponseDto,
  targetPath: string,
  fetched: DirectoryResponseDto,
): DirectoryResponseDto {
  if (root.path === targetPath) {
    return { ...root, files: fetched.files, directories: fetched.directories };
  }

  return {
    ...root,
    directories: root.directories.map((dir) => mergeDirectoryIntoTree(dir, targetPath, fetched)),
  };
}

function refreshDirectoryInTree(
  root: DirectoryResponseDto,
  parentPath: string,
  fetched: DirectoryResponseDto,
): DirectoryResponseDto {
  if (root.path === parentPath) {
    return fetched;
  }

  return {
    ...root,
    directories: root.directories.map((dir) => refreshDirectoryInTree(dir, parentPath, fetched)),
  };
}

export const AngularFileExplorerStore = signalStore(
  { providedIn: 'root' },
  withState<FileExplorerComponentState>({
    directory: null,
    file: null,
    loading: false,
  }),
  partialStore.withLoading(),
  partialStore.withDialog(),
  withProps(() => ({
    service: inject(FileExplorerService),
    wsService: inject(FileExplorerWsService),
  })),
  withMethods((state) => {
    const refreshParentDirectory = (childPath: string) => {
      const parentPath = childPath.substring(0, childPath.lastIndexOf('/'));
      const targetPath = parentPath || state.directory()?.path;
      if (!targetPath || !state.directory()) {
        return;
      }

      state.service.readDirectory(targetPath).subscribe((fetched) => {
        if (!fetched || !state.directory()) {
          return;
        }
        patchState(state, {
          directory: refreshDirectoryInTree(state.directory()!, targetPath, fetched),
        });
      });
    };

    return {
      refreshParentDirectory,
      getDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.readDirectory(path)),
          tap((directory) => {
            tap(() => state.setLoading(false));
            if (!directory) {
              return;
            }
            patchState(state, { directory });
          }),
        ),
      ),
      expandDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.readDirectory(path)),
          tap((fetched) => {
            tap(() => state.setLoading(false));
            if (!fetched || !state.directory()) {
              return;
            }

            patchState(state, {
              directory: mergeDirectoryIntoTree(state.directory()!, fetched.path, fetched),
            });
          }),
        ),
      ),
      getFile: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.getFile(path)),
          tap((file) => {
            tap(() => state.setLoading(false));
            if (!file) {
              return;
            }

            patchState(state, { file });
          }),
        ),
      ),
      updateFile: rxMethod<FileResponseDto>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((file: FileResponseDto) => state.service.updateFile(file)),
          tap((file) => {
            tap(() => state.setLoading(false));
            if (!file) {
              return;
            }

            patchState(state, { file, loading: false });
          }),
        ),
      ),
      rename: rxMethod<RenameRequestDto>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((payload: RenameRequestDto) => state.service.rename(payload)),
          tap((result) => {
            tap(() => state.setLoading(false));
            if (!result) {
              return;
            }

            refreshParentDirectory(result.path);
          }),
        ),
      ),
      createFile: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.createFile(path)),
          tap((file) => {
            tap(() => state.setLoading(false));
            if (!file) {
              return;
            }

            patchState(state, { file });
            refreshParentDirectory(file.path);
          }),
        ),
      ),
      createDirectory: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.createDirectory(path)),
          tap((directory) => {
            if (!directory) {
              patchState(state, { loading: false });
              return;
            }

            refreshParentDirectory(directory.path);
          }),
        ),
      ),
      delete: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.delete(path)),
          tap((result) => {
            tap(() => state.setLoading(false));
            refreshParentDirectory(result.path);
          }),
        ),
      ),
      listenToFileChanges: rxMethod<void>(
        pipe(
          switchMap(() => state.wsService.fileChanges$),
          tap((event) => refreshParentDirectory(event.path)),
        ),
      ),
    };
  }),
  withHooks({
    onInit(state) {
      state.getDirectory(ROOT_PATH);
      state.wsService.watchPath(ROOT_PATH);

      state.listenToFileChanges();
    },
  }),
);
