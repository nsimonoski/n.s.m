import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ChatMessage } from '@org/react-data-access';

interface AiMessageProps {
  message: ChatMessage;
}

export function AiMessage({ message }: AiMessageProps) {
  const renderedHtml = useMemo(() => {
    if (message.role !== 'assistant') return '';
    const rawHtml = marked.parse(message.content) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [message.role, message.content]);

  return (
    <div className={`ai-message ${message.role}`}>
      {message.role === 'user' ? (
        <div className="ai-message-content">{message.content}</div>
      ) : (
        <>
          <div
            className="ai-message-content ai-message-markdown"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
          {message.isStreaming && <span className="ai-message-cursor">|</span>}
        </>
      )}
    </div>
  );
}
