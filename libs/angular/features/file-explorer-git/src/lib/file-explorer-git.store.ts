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
import { DirectoryResponseDto, Enums } from '@org/shared/contracts';
import { editor, partialStore } from '@org/angular-utils';
import { FileExplorerService } from '@org/angular-data-access';
import { GitService } from './data-access/git.service';
import { GitWsService } from './data-access/git-ws.service';

const ROOT_PATH = '/Users/nsm/Desktop/repos/n.s.m';

function collectDirectoryPaths(dir: DirectoryResponseDto): string[] {
  const paths = [dir.path];
  for (const child of dir.directories) {
    paths.push(...collectDirectoryPaths(child));
  }
  return paths;
}

interface GitExplorerState {
  branch: string;
  changesTree: DirectoryResponseDto | null;
  statusMap: Record<string, string>;
  commitMessage: string;
  ahead: number;
  behind: number;
  stagedCount: number;
  changesCount: number;
}

export const FileExplorerGitStore = signalStore(
  { providedIn: 'root' },
  withState<GitExplorerState>({
    branch: '',
    changesTree: null,
    statusMap: {},
    commitMessage: '',
    ahead: 0,
    behind: 0,
    stagedCount: 0,
    changesCount: 0,
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
  withMethods((state) => {
    const patchFromResponse = (response: {
      branch: string;
      tree: DirectoryResponseDto;
      statusMap: Record<string, string>;
      ahead: number;
      behind: number;
      stagedCount: number;
      changesCount: number;
    }) => {
      patchState(state, {
        branch: response.branch,
        changesTree: response.tree,
        statusMap: response.statusMap,
        ahead: response.ahead,
        behind: response.behind,
        stagedCount: response.stagedCount,
        changesCount: response.changesCount,
      });
      state.expandAll(collectDirectoryPaths(response.tree));
    };

    const refreshStatus = () => {
      state.service.getStatusTree(ROOT_PATH).subscribe(patchFromResponse);
    };

    return {
      getStatus: rxMethod<string>(
        pipe(
          tap(() => state.setLoading()),
          switchMap((path: string) => state.service.getStatusTree(path)),
          tap((response) => {
            state.setLoading(false);
            patchFromResponse(response);
          }),
        ),
      ),
      stage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) => state.service.stage(ROOT_PATH, paths)),
          tap(() => refreshStatus()),
        ),
      ),
      unstage: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) => state.service.unstage(ROOT_PATH, paths)),
          tap(() => refreshStatus()),
        ),
      ),
      discard: rxMethod<string[]>(
        pipe(
          switchMap((paths: string[]) => state.service.discard(ROOT_PATH, paths)),
          tap(() => refreshStatus()),
        ),
      ),
      setCommitMessage: (commitMessage: string) => {
        state.saveToStorage({ commitMessage });
      },
      commit: rxMethod<string>(
        pipe(
          switchMap((message: string) =>
            state.service
              .commit(ROOT_PATH, message)
              .pipe(switchMap(() => state.service.getStatusTree(ROOT_PATH))),
          ),
          tap((response) => {
            state.saveToStorage({ commitMessage: '' });
            patchFromResponse(response);
          }),
        ),
      ),
      sync: rxMethod<void>(
        pipe(
          switchMap(() =>
            state.service
              .push(ROOT_PATH)
              .pipe(switchMap(() => state.service.getStatusTree(ROOT_PATH))),
          ),
          tap(patchFromResponse),
        ),
      ),
      listenToGitChanges: rxMethod<void>(
        pipe(
          switchMap(() => state.wsService.gitChanges$),
          tap((event) => refreshStatus()),
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
    };
  }),
  withHooks({
    onInit(state) {
      state.loadFromStorage();
      state.getStatus(ROOT_PATH);
      state.wsService.watchPath(ROOT_PATH);
      state.listenToGitChanges();
    },
  }),
);
