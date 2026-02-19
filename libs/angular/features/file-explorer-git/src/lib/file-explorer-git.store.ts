import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { DirectoryResponseDto } from '@org/shared/contracts';
import { editor, partialStore } from '@org/angular-utils';
import { FileExplorerService, GitService, GitWsService } from '@org/angular-data-access';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

function collectDirectoryPaths(dir: DirectoryResponseDto): string[] {
  const paths = [dir.path];
  for (const child of dir.directories) {
    paths.push(...collectDirectoryPaths(child));
  }
  return paths;
}

interface GitExplorerState {
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
  commitMessage: string;
  ahead: number;
  behind: number;
}

export const FileExplorerGitStore = signalStore(
  { providedIn: 'root' },
  withState<GitExplorerState>({
    changesTree: null,
    statusMap: {},
    commitMessage: '',
    ahead: 0,
    behind: 0,
  }),
  partialStore.withLoading(),
  partialStore.withFileTree(),
  partialStore.withBrowserStorage({ key: 'git-explorer', debounce: 300 }),
  withProps(() => ({
    service: inject(GitService),
    wsService: inject(GitWsService),
    fileService: inject(FileExplorerService),
    editorStore: inject(editor.EditorStore),
  })),
  withMethods((state) => ({
    getStatus: rxMethod<string>(
      pipe(
        tap(() => state.setLoading()),
        switchMap((path: string) => state.service.getStatusTree(path)),
        tap(({ tree: changesTree, branch, stagedCount, changesCount, ...rest }) => {
          state.setLoading(false);
          patchState(state, { changesTree, ...rest });
          state.expandAll(collectDirectoryPaths(changesTree));
        }),
      ),
    ),
    stage: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.stage(ROOT_PATH, paths))),
    ),
    unstage: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.unstage(ROOT_PATH, paths))),
    ),
    discard: rxMethod<string[]>(
      pipe(switchMap((paths: string[]) => state.service.discard(ROOT_PATH, paths))),
    ),
    setCommitMessage: (commitMessage: string) => {
      state.saveToStorage({ commitMessage });
    },
    commit: rxMethod<string>(
      pipe(
        switchMap((message: string) => state.service.commit(ROOT_PATH, message)),
        tap(() => state.saveToStorage({ commitMessage: '' })),
      ),
    ),
    sync: rxMethod<void>(pipe(switchMap(() => state.service.push(ROOT_PATH)))),
    listenToGitChanges: rxMethod<void>(
      pipe(
        switchMap(() => state.wsService.gitChanges$),
        tap(({ tree: changesTree, branch, stagedCount, changesCount, ...rest }) => {
          patchState(state, { changesTree, ...rest });
          state.expandAll(collectDirectoryPaths(changesTree));
        }),
      ),
    ),
    openDiff: rxMethod<string>(
      pipe(
        switchMap((filePath: string) =>
          forkJoin({
            headContent: state.service.showDiff(ROOT_PATH, filePath),
            currentFile: state.fileService.getFile(`${ROOT_PATH}/${filePath}`),
          }),
        ),
        tap(({ headContent, currentFile }) => {
          const ext = currentFile.extension ?? currentFile.name.split('.').pop() ?? '';
          const language = editor.getMonacoLanguage(currentFile.type, ext);
          state.editorStore.openDiff(
            currentFile.path,
            currentFile.name,
            headContent.content,
            currentFile.content ?? '',
            language,
          );
        }),
      ),
    ),
  })),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.getStatus(ROOT_PATH);
      state.wsService.watchPath(ROOT_PATH);
      state.listenToGitChanges();
    },
  }),
);
