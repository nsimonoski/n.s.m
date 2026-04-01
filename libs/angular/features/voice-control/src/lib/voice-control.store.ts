import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, from, pipe, switchMap, tap } from 'rxjs';
import { Ai, Terminal, VoiceControl } from '@org/shared/contracts';
import { VoiceControl as VoiceControlUtils } from '@org/shared/utils';
import { SnackbarService } from '@org/angular/ui';
import {
  IdeStore,
  TerminalWsService,
  VoiceService,
  withGitActions,
} from '@org/angular-data-access';
import { TerminalSessionStore } from '@org/angular-terminal';

type VoicePhase = 'idle' | 'recording' | 'processing' | 'confirming' | 'error';

interface VoiceControlState {
  phase: VoicePhase;
  transcription: string;
  commandResult: VoiceControl.VoiceCommandResult | null;
  error: string;
  showCommandList: boolean;
}

export const VoiceControlStore = signalStore(
  { providedIn: 'root' },
  withState<VoiceControlState>({
    phase: 'idle',
    transcription: '',
    commandResult: null,
    error: '',
    showCommandList: false,
  }),
  withGitActions(),
  withProps(() => ({
    recorder: new VoiceControlUtils.AudioRecorder(),
    voiceService: inject(VoiceService),
    editorStore: inject(IdeStore.CodeEditorStore),
    gitStatusStore: inject(IdeStore.GitStatusStore),
    layoutStore: inject(IdeStore.IdeLayoutStore),
    fileExplorerStore: inject(IdeStore.FileExplorerStore),
    aiChatStore: inject(IdeStore.AiChatStore),
    terminalSessionStore: inject(TerminalSessionStore),
    terminalWs: inject(TerminalWsService),
    authStore: inject(IdeStore.AuthStore),
    snackbar: inject(SnackbarService),
  })),
  withMethods((store) => ({
    async startRecording(): Promise<void> {
      if (!VoiceControlUtils.AudioRecorder.isSupported()) {
        store.snackbar.error('Voice recording is not supported in this browser');
        return;
      }
      try {
        await store.recorder.start();
        patchState(store, { phase: 'recording', error: '' });
      } catch {
        patchState(store, { phase: 'error', error: 'Microphone access denied' });
        store.snackbar.error('Microphone access denied');
      }
    },

    cancelRecording(): void {
      store.recorder.cancel();
      patchState(store, { phase: 'idle', transcription: '', commandResult: null, error: '' });
    },

    dismiss(): void {
      patchState(store, { phase: 'idle', transcription: '', commandResult: null, error: '' });
    },

    stopAndProcess: rxMethod<void>(
      pipe(
        switchMap(() => {
          patchState(store, { phase: 'processing' });
          return from(store.recorder.stop());
        }),
        switchMap((blob: Blob) => store.voiceService.processCommand(blob)),
        tap((result) => {
          patchState(store, {
            phase: 'confirming',
            transcription: result.rawTranscription,
            commandResult: result,
          });
        }),
        catchError((err) => {
          patchState(store, { phase: 'error', error: String(err?.message ?? err) });
          store.snackbar.error(String(err?.message ?? 'Voice command failed'));
          return EMPTY;
        }),
      ),
    ),
  })),
  withMethods((store) => ({
    toggleCommandList(): void {
      patchState(store, { showCommandList: !store.showCommandList() });
    },

    closeCommandList(): void {
      patchState(store, { showCommandList: false });
    },

    executeCommand(): void {
      const result = store.commandResult();
      if (!result) return;

      switch (result.intent) {
        // --- Git ---
        case VoiceControl.VoiceIntent.GitCommit:
          store.gitCommit(result.params['message'] ?? '');
          break;

        case VoiceControl.VoiceIntent.GitPush:
          store.gitPush();
          break;

        case VoiceControl.VoiceIntent.GitStageAll:
          store.gitStage(['.']);
          break;

        case VoiceControl.VoiceIntent.GitStash:
          store.gitStash();
          break;

        case VoiceControl.VoiceIntent.GitStashPop:
          store.gitStashPop();
          break;

        case VoiceControl.VoiceIntent.GitUnstageAll:
          store.gitUnstage(['.']);
          break;

        case VoiceControl.VoiceIntent.GitDiscardAll:
          store.gitDiscard(['.']);
          break;

        case VoiceControl.VoiceIntent.GitCheckout:
          store.gitStatusStore.checkout(result.params['branch']);
          break;

        // --- Editor ---
        case VoiceControl.VoiceIntent.EditorSave: {
          const activeFile = store.editorStore.activeFile();
          if (activeFile) {
            store.editorStore.saveFile(activeFile.path);
            store.snackbar.success('File saved');
          }
          break;
        }

        case VoiceControl.VoiceIntent.EditorCloseTab: {
          const activeTabId = store.editorStore.activeTabId();
          if (activeTabId) store.editorStore.closeFile(activeTabId);
          break;
        }

        case VoiceControl.VoiceIntent.EditorCloseAll:
          store.editorStore.closeAll();
          break;

        case VoiceControl.VoiceIntent.EditorCloseOthers: {
          const activeId = store.editorStore.activeTabId();
          if (activeId) store.editorStore.closeOthers(activeId);
          break;
        }

        // --- Layout ---
        case VoiceControl.VoiceIntent.LayoutToggleTerminal:
          store.layoutStore.toggleTerminal();
          break;

        case VoiceControl.VoiceIntent.LayoutSwitchPanel:
          store.layoutStore.setActivePanel(result.params['panel'] ?? 'explorer');
          break;

        case VoiceControl.VoiceIntent.LayoutToggleSidebar:
          store.layoutStore.toggleSidebar();
          break;

        // --- AI ---
        case VoiceControl.VoiceIntent.AiChat:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.sendMessage({ userMessage: result.params['message'] ?? '' });
          break;

        case VoiceControl.VoiceIntent.AiExplain:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.explainCurrentFile();
          break;

        case VoiceControl.VoiceIntent.AiReview:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.sendMessage({
            userMessage: 'Review the current file for potential issues, bugs, and improvements.',
            command: Ai.CommandType.CHAT,
          });
          break;

        case VoiceControl.VoiceIntent.AiRefactor:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.sendMessage({
            userMessage:
              result.params['instruction'] ||
              'Refactor the current file to improve code quality and readability.',
            command: Ai.CommandType.MODIFY,
          });
          break;

        case VoiceControl.VoiceIntent.AiFixError:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.sendMessage({
            userMessage: result.params['instruction'] || 'Fix any errors in the current file.',
            command: Ai.CommandType.MODIFY,
          });
          break;

        case VoiceControl.VoiceIntent.AiClearChat:
          store.aiChatStore.clearMessages();
          break;

        // --- Terminal ---
        case VoiceControl.VoiceIntent.TerminalRun: {
          const sessionId = store.terminalSessionStore.activeSessionId();
          if (!store.layoutStore.terminalOpen()) {
            store.layoutStore.toggleTerminal();
          }
          if (sessionId) {
            store.terminalWs.emit(Terminal.TERMINAL_DATA_EVENT, {
              sessionId,
              data: result.params['command'] + '\r',
            } satisfies Terminal.TerminalDataDto);
          } else {
            store.snackbar.error('No active terminal session');
          }
          break;
        }

        case VoiceControl.VoiceIntent.TerminalClear: {
          const clearSessionId = store.terminalSessionStore.activeSessionId();
          if (clearSessionId) {
            store.terminalWs.emit(Terminal.TERMINAL_DATA_EVENT, {
              sessionId: clearSessionId,
              data: 'clear\r',
            } satisfies Terminal.TerminalDataDto);
          }
          break;
        }

        case VoiceControl.VoiceIntent.TerminalKill: {
          const killSessionId = store.terminalSessionStore.activeSessionId();
          if (killSessionId) {
            store.terminalWs.emit(Terminal.TERMINAL_DATA_EVENT, {
              sessionId: killSessionId,
              data: '\x03',
            } satisfies Terminal.TerminalDataDto);
          }
          break;
        }

        case VoiceControl.VoiceIntent.TerminalNewSession:
          if (!store.layoutStore.terminalOpen()) {
            store.layoutStore.toggleTerminal();
          }
          store.terminalSessionStore.requestNew();
          break;

        // --- File ---
        case VoiceControl.VoiceIntent.FileCreate: {
          const activeFile = store.editorStore.activeFile();
          const root = store.authStore.workspace()?.rootPath;
          const filePath = resolvePath(activeFile?.path, root, result.params['path']);
          if (filePath) {
            store.fileExplorerStore.createFile(filePath);
            store.snackbar.success(`Creating file at ${filePath}`);
          }
          break;
        }

        case VoiceControl.VoiceIntent.DirCreate: {
          const activeFile = store.editorStore.activeFile();
          const root = store.authStore.workspace()?.rootPath;
          const dirPath = resolvePath(activeFile?.path, root, result.params['path']);
          if (dirPath) {
            store.fileExplorerStore.createDirectory(dirPath);
            store.snackbar.success(`Creating directory at ${dirPath}`);
          }
          break;
        }

        default:
          store.snackbar.error(`Unknown command: "${result.rawTranscription}"`);
          break;
      }

      patchState(store, { phase: 'idle', transcription: '', commandResult: null });
    },
  })),
  withMethods((store) => ({
    selectCommand(cmd: VoiceControlUtils.VoiceCommandDescriptor): void {
      patchState(store, { showCommandList: false });
      if (cmd.requiredParams.length > 0) {
        store.startRecording();
      } else {
        patchState(store, {
          commandResult: {
            intent: cmd.intent,
            params: {},
            rawTranscription: cmd.label,
            confidence: 1,
          },
        });
        store.executeCommand();
      }
    },
  })),
);

function resolvePath(
  activeFilePath: string | undefined,
  rootPath: string | undefined,
  relativePath?: string,
): string | null {
  if (!relativePath) return null;
  if (activeFilePath) {
    const dir = activeFilePath.substring(0, activeFilePath.lastIndexOf('/'));
    return `${dir}/${relativePath}`;
  }
  if (rootPath) return `${rootPath}/${relativePath}`;
  return null;
}
