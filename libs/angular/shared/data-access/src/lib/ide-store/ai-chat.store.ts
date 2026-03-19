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
import { Ai, FileResponseDto } from '@org/shared/contracts';
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
  partialStore.withSnackbar(),
  withProps(() => ({
    aiService: inject(AiService),
    editorStore: inject(CodeEditorStore),
  })),
  withComputed((state) => ({
    history: computed((): Ai.HistoryEntry[] =>
      state
        .messages()
        .filter((m) => !m.isStreaming)
        .map((m) => ({ role: m.role, content: m.content })),
    ),
    questionCount: computed(() => state.messages().filter((m) => m.role === Ai.Role.USER).length),
    isLimitReached: computed(
      () => state.messages().filter((m) => m.role === Ai.Role.USER).length >= QUESTION_LIMIT,
    ),
    hasActiveFile: computed(() => !!state.editorStore.activeFile()),
  })),
  withMethods((store) => ({
    sendMessage(userMessage: string, command: Ai.CommandType = Ai.CommandType.CHAT): void {
      if (store.isStreaming() || store.isLimitReached()) return;

      const fileContext = buildFileContext(store.editorStore);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: Ai.Role.USER,
        content: command === Ai.CommandType.EXPLAIN ? 'Explain this file' : userMessage,
        isStreaming: false,
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: Ai.Role.ASSISTANT,
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
          store.showSnackBar('AI request failed');
        },
      });
    },
  })),
  withMethods((store) => ({
    explainCurrentFile(): void {
      store.sendMessage('', Ai.CommandType.EXPLAIN);
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

  const diffFile: FileResponseDto = {
    id: activeFile.tabId,
    name: activeFile.name,
    path: activeFile.path,
    content: modifiedContent,
    type: activeFile.type,
    extension: activeFile.extension,
    updatedAt: activeFile.updatedAt,
  };

  editorStore.openDiff(diffFile, activeFile.currentContent);
}
