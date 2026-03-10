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
import { Ai } from '@org/shared/contracts';
import { SnackbarService } from '@org/angular/ui';
import { partialStore } from '@org/angular-utils';
import { AiService } from '../ai.service';
import { CodeEditorStore } from './code-editor.store';

const QUESTION_LIMIT = 5;

export interface ChatMessage {
  id: string;
  role: Ai.Role;
  content: string;
  isStreaming: boolean;
}

interface AiChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export const AiChatStore = signalStore(
  { providedIn: 'root' },
  withState<AiChatState>({
    messages: [],
    isStreaming: false,
  }),
  partialStore.withBrowserStorage({ key: 'ai-chat' }),
  withProps(() => ({
    aiService: inject(AiService),
    editorStore: inject(CodeEditorStore),
    snackbar: inject(SnackbarService),
  })),
  withComputed((state) => ({
    history: computed((): Ai.HistoryEntry[] =>
      state
        .messages()
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content })),
    ),
    questionCount: computed(() => state.messages().filter((m) => m.role === 'user').length),
    isLimitReached: computed(
      () => state.messages().filter((m) => m.role === 'user').length >= QUESTION_LIMIT,
    ),
  })),
  withMethods((store) => ({
    sendMessage(userMessage: string, command: Ai.CommandType = 'chat'): void {
      if (store.isStreaming() || store.isLimitReached()) return;

      const fileContext = buildFileContext(store.editorStore);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: command === 'explain' ? 'Explain this file' : userMessage,
        isStreaming: false,
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      patchState(store, {
        messages: [...store.messages(), userMsg, assistantMsg],
        isStreaming: true,
      });

      const request: Ai.ChatRequestDto = {
        message: userMessage,
        command,
        fileContext,
        history: store.history(),
      };

      let modifiedContent: string | undefined;

      store.aiService.sendMessage(request).subscribe({
        next: (chunk) => {
          const messages = store
            .messages()
            .map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + chunk.delta } : m));
          patchState(store, { messages });

          if (chunk.done && chunk.modifiedContent) {
            modifiedContent = chunk.modifiedContent;
          }
        },
        complete: () => {
          const messages = store
            .messages()
            .map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
          patchState(store, { messages, isStreaming: false });
          store.saveToStorage({ messages });

          if (modifiedContent && fileContext) {
            openDiffWithModifiedContent(store.editorStore, modifiedContent);
          }
        },
        error: () => {
          const messages = store
            .messages()
            .map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: 'Error: Failed to get AI response.', isStreaming: false }
                : m,
            );
          patchState(store, { messages, isStreaming: false });
          store.saveToStorage({ messages });
          store.snackbar.error('AI request failed');
        },
      });
    },
  })),
  withMethods((store) => ({
    explainCurrentFile(): void {
      store.sendMessage('', 'explain');
    },

    clearMessages(): void {
      store.saveToStorage({ messages: [] });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadFromStorage();
    },
  }),
);

function buildFileContext(
  editorStore: InstanceType<typeof CodeEditorStore>,
): Ai.FileContext | null {
  const activeFile = editorStore.activeFile();
  if (!activeFile) return null;

  return {
    filePath: activeFile.path,
    language: activeFile.language,
    content: activeFile.currentContent,
  };
}

function openDiffWithModifiedContent(
  editorStore: InstanceType<typeof CodeEditorStore>,
  modifiedContent: string,
): void {
  const activeFile = editorStore.activeFile();
  if (!activeFile) return;

  editorStore.openDiff(
    { ...activeFile, content: modifiedContent } as any,
    activeFile.currentContent,
  );
}
