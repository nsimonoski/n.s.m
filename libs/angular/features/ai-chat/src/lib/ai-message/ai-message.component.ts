import {
  AfterViewChecked,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  SecurityContext,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { ChatMessage, TerminalWsService } from '@org/angular-data-access';
import { TerminalSessionStore } from '@org/angular-terminal';
import { Terminal } from '@org/shared/contracts';

const TERMINAL_LANGS = new Set(['', 'bash', 'sh', 'shell', 'zsh']);

@Component({
  selector: 'ide-ai-message',
  standalone: true,
  templateUrl: './ai-message.component.html',
  styleUrls: ['./ai-message.component.scss'],
})
export class AiMessageComponent implements AfterViewChecked {
  readonly message = input.required<ChatMessage>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly el = inject(ElementRef);
  private readonly terminalWs = inject(TerminalWsService);
  private readonly terminalSessionStore = inject(TerminalSessionStore);

  readonly renderedHtml = computed(() => {
    const msg = this.message();
    if (msg.role !== 'assistant') return '';

    const rawHtml = marked.parse(msg.content) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) ?? '';
  });

  ngAfterViewChecked(): void {
    const container: HTMLElement = this.el.nativeElement;
    const preElements = container.querySelectorAll<HTMLPreElement>('pre');

    for (const pre of Array.from(preElements)) {
      if (pre.parentElement?.classList.contains('ai-code-block-wrapper')) continue;

      const wrapper = document.createElement('div');
      wrapper.className = 'ai-code-block-wrapper';
      pre.parentNode!.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const actions = document.createElement('div');
      actions.className = 'ai-code-actions';

      actions.appendChild(this.createCopyButton(pre));

      const lang = detectLanguage(pre);
      if (TERMINAL_LANGS.has(lang)) {
        actions.appendChild(this.createRunButton(pre));
      }

      wrapper.appendChild(actions);
    }
  }

  private createCopyButton(pre: HTMLPreElement): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'ai-code-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.textContent ?? '');
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    });
    return btn;
  }

  private createRunButton(pre: HTMLPreElement): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'ai-code-btn';
    btn.textContent = 'Run';
    btn.addEventListener('click', async () => {
      const sessionId = await this.terminalSessionStore.ensureSession();
      if (!sessionId) return;

      const command = (pre.textContent ?? '').trim();
      this.terminalWs.emit(Terminal.TERMINAL_DATA_EVENT, {
        sessionId,
        data: command + '\r',
      } satisfies Terminal.TerminalDataDto);
    });
    return btn;
  }
}

function detectLanguage(pre: HTMLPreElement): string {
  const code = pre.querySelector('code');
  if (!code) return '';
  const match = code.className.match(/language-(\w+)/);
  return match ? match[1] : '';
}
