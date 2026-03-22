import { useRef, useState } from 'react';
import { useAiChatStore, useCodeEditorStore } from '@org/react-data-access';
import { Ai } from '@org/shared/contracts';
import { AiMessage } from './ai-message/ai-message';
import './ai-chat.scss';

export function AiChat() {
  const [inputValue, setInputValue] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  const messages = useAiChatStore((s) => s.messages);
  const isStreaming = useAiChatStore((s) => s.isStreaming);
  const sendUserMessage = useAiChatStore((s) => s.sendUserMessage);
  const explainCurrentFile = useAiChatStore((s) => s.explainCurrentFile);
  const clearMessages = useAiChatStore((s) => s.clearMessages);

  const questionCount = messages.filter((m) => m.role === Ai.Role.USER).length;
  const isLimitReached = questionCount >= 5;
  const openFiles = useCodeEditorStore((s) => s.openFiles);
  const activeTabId = useCodeEditorStore((s) => s.activeTabId);
  const hasActiveFile = openFiles.some((f) => f.tabId === activeTabId && f.mode === 'regular');

  function onSend(): void {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue('');
    sendUserMessage(message, Ai.CommandType.CHAT);
    scrollToBottom();
  }

  function onExplain(): void {
    explainCurrentFile();
    scrollToBottom();
  }

  function onModify(): void {
    const message = inputValue.trim();
    if (!message || isStreaming) return;

    setInputValue('');
    sendUserMessage(message, Ai.CommandType.MODIFY);
    scrollToBottom();
  }

  function onKeydown(event: React.KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  function scrollToBottom(): void {
    setTimeout(() => {
      const el = messagesRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <span className="ai-chat-title">AI Assistant</span>
        <div className="ai-chat-actions">
          <button
            className="ai-chat-action-btn"
            onClick={onExplain}
            disabled={isStreaming || isLimitReached || !hasActiveFile}
            title="Explain current file"
          >
            Explain File
          </button>
          <button
            className="ai-chat-action-btn ghost"
            onClick={clearMessages}
            disabled={isLimitReached}
            title="Clear chat"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="ai-chat-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <p>Ask anything about your code, or use the buttons above.</p>
            <p className="ai-chat-hint">
              Tip: Use &quot;Explain File&quot; to explain the active file, or type a change
              instruction and click &quot;Modify&quot;.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <AiMessage key={message.id} message={message} />
        ))}
      </div>

      {isLimitReached && (
        <div className="ai-chat-limit">Session limit reached. Clear the chat to continue.</div>
      )}

      <div className="ai-chat-input-area">
        <textarea
          className="ai-chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask AI or describe a change... (Enter to send)"
          rows={3}
          disabled={isStreaming || isLimitReached}
          onKeyDown={onKeydown}
        />
        <div className="ai-chat-input-actions">
          <button
            className="ai-chat-send-btn"
            onClick={onSend}
            disabled={isStreaming || isLimitReached || !inputValue.trim()}
          >
            Send
          </button>
          <button
            className="ai-chat-modify-btn"
            onClick={onModify}
            disabled={isStreaming || isLimitReached || !inputValue.trim()}
            title="Apply instruction as code change (opens diff view)"
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
}

