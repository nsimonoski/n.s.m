import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdeStore } from '@org/angular-data-access';
import { AiMessageComponent } from '../ai-message/ai-message.component';

@Component({
  selector: 'ide-ai-chat',
  standalone: true,
  imports: [FormsModule, AiMessageComponent],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
})
export class AiChatComponent {
  readonly store = inject(IdeStore.AiChatStore);
  readonly messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  inputValue = '';

  onSend(): void {
    const message = this.inputValue.trim();
    if (!message || this.store.isStreaming()) return;

    this.inputValue = '';
    this.store.sendMessage(message, 'chat');
    this.scrollToBottomAfterDelay();
  }

  onExplain(): void {
    this.store.explainCurrentFile();
    this.scrollToBottomAfterDelay();
  }

  onModify(): void {
    const message = this.inputValue.trim();
    if (!message || this.store.isStreaming()) return;

    this.inputValue = '';
    this.store.sendMessage(message, 'modify');
    this.scrollToBottomAfterDelay();
  }

  onClear(): void {
    this.store.clearMessages();
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      this.onSend();
    }
  }

  private scrollToBottomAfterDelay(): void {
    setTimeout(() => {
      const el = this.messagesContainer()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
