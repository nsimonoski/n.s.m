import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, from, pipe, switchMap, tap } from 'rxjs';
import { Terminal, VoiceControl } from '@org/shared/contracts';
import { VoiceControl as VoiceControlUtils } from '@org/shared/utils';
import { SnackbarService } from '@org/angular/ui';
import { IdeStore, TerminalWsService, VoiceService, withGitActions } from '@org/angular-data-access';

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
    layoutStore: inject(IdeStore.IdeLayoutStore),
    fileExplorerStore: inject(IdeStore.FileExplorerStore),
    aiChatStore: inject(IdeStore.AiChatStore),
    terminalWs: inject(TerminalWsService),
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

        case VoiceControl.VoiceIntent.LayoutToggleTerminal:
          store.layoutStore.toggleTerminal();
          break;

        case VoiceControl.VoiceIntent.LayoutSwitchPanel:
          store.layoutStore.setActivePanel(result.params['panel'] ?? 'explorer');
          break;

        case VoiceControl.VoiceIntent.AiChat:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.sendMessage({ userMessage: result.params['message'] ?? '' });
          break;

        case VoiceControl.VoiceIntent.AiExplain:
          store.layoutStore.setActivePanel('ai');
          store.aiChatStore.explainCurrentFile();
          break;

        case VoiceControl.VoiceIntent.TerminalRun: {
          const sessionId = store.layoutStore.activeTerminalSessionId();
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

        case VoiceControl.VoiceIntent.FileCreate:
          store.fileExplorerStore.createFile(result.params['path'] ?? '');
          break;

        case VoiceControl.VoiceIntent.DirCreate:
          store.fileExplorerStore.createDirectory(result.params['path'] ?? '');
          break;

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
          commandResult: { intent: cmd.intent, params: {}, rawTranscription: cmd.label, confidence: 1 },
        });
        store.executeCommand();
      }
    },
  })),
);
