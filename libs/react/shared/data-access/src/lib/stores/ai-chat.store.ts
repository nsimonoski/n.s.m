import { create } from 'zustand';
import { Ai, FileResponseDto } from '@org/shared/contracts';
import { browserStorage } from '@org/shared/utils';
import { sendMessage } from '../services/ai.service';
import { useCodeEditorStore } from './code-editor.store';
import { useSnackbarStore } from './snackbar.store';

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

interface AiChatActions {
  sendUserMessage: (userMessage: string, command?: Ai.CommandType) => void;
  explainCurrentFile: () => void;
  clearMessages: () => void;
}

interface StoredAiChatState {
  messages: ChatMessage[];
}

const storage = browserStorage<StoredAiChatState>('ai-chat');

export const useAiChatStore = create<AiChatState & AiChatActions>((set, get) => ({
  messages: storage.load()?.messages ?? [],
  isStreaming: false,

  sendUserMessage(userMessage: string, command: Ai.CommandType = Ai.CommandType.CHAT): void {
    const { isStreaming, messages } = get();
    if (isStreaming || isLimitReached(messages)) return;

    const fileContext = getFileContext();
    const assistantMsgId = crypto.randomUUID();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: Ai.Role.USER,
      content: command === Ai.CommandType.EXPLAIN ? 'Explain this file' : userMessage,
      isStreaming: false,
    };

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: Ai.Role.ASSISTANT,
      content: '',
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMsg, assistantMsg];
    set({ messages: updatedMessages, isStreaming: true });

    const history: Ai.HistoryEntry[] = updatedMessages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    const request: Ai.ChatRequestDto = { message: userMessage, command, fileContext, history };

    let modifiedContent: string | undefined;

    sendMessage(request, {
      onChunk(chunk) {
        set({
          messages: get().messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + chunk.delta } : m,
          ),
        });

        if (chunk.done && chunk.modifiedContent) {
          modifiedContent = chunk.modifiedContent;
        }
      },
      onComplete() {
        const finalMessages = get().messages.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
        );
        set({ messages: finalMessages, isStreaming: false });
        storage.save({ messages: finalMessages });

        if (modifiedContent && fileContext) {
          openDiffWithModifiedContent(modifiedContent);
        }
      },
      onError() {
        const errorMessages = get().messages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: 'Error: Failed to get AI response.', isStreaming: false }
            : m,
        );
        set({ messages: errorMessages, isStreaming: false });
        storage.save({ messages: errorMessages });
        useSnackbarStore.getState().error('AI request failed');
      },
    });
  },

  explainCurrentFile(): void {
    get().sendUserMessage('', Ai.CommandType.EXPLAIN);
  },

  clearMessages(): void {
    set({ messages: [], isStreaming: false });
    storage.save({ messages: [] });
  },
}));

function isLimitReached(messages: ChatMessage[]): boolean {
  return messages.filter((m) => m.role === Ai.Role.USER).length >= QUESTION_LIMIT;
}

function getFileContext(): Ai.FileContext | null {
  const { openFiles, activeTabId } = useCodeEditorStore.getState();
  const activeFile = openFiles.find((f) => f.tabId === activeTabId && f.mode === 'regular');
  if (!activeFile) return null;

  return {
    filePath: activeFile.path,
    language: activeFile.language,
    content: activeFile.currentContent,
  };
}

function openDiffWithModifiedContent(modifiedContent: string): void {
  const { openFiles, activeTabId, openDiff } = useCodeEditorStore.getState();
  const activeFile = openFiles.find((f) => f.tabId === activeTabId && f.mode === 'regular');
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

  openDiff(diffFile, activeFile.currentContent);
}
