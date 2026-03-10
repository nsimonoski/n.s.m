import { Component, computed, inject, input, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { ChatMessage } from '@org/angular-data-access';

@Component({
  selector: 'ide-ai-message',
  standalone: true,
  templateUrl: './ai-message.component.html',
  styleUrls: ['./ai-message.component.scss'],
})
export class AiMessageComponent {
  readonly message = input.required<ChatMessage>();

  private readonly sanitizer = inject(DomSanitizer);

  readonly renderedHtml = computed(() => {
    const msg = this.message();
    if (msg.role !== 'assistant') return '';

    const rawHtml = marked.parse(msg.content) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
  });
}
