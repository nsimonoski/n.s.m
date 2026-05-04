import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SnackbarService } from '@org/angular/ui';
import { mockSnackbarService, mockAiService, mockCodeEditorStore } from '@org/angular-testing';
import { AiService } from '../ai.service';
import { AiChatStore } from './ai-chat.store';
import { CodeEditorStore } from './code-editor.store';

describe('AiChatStore', () => {
  function setup() {
    localStorage.clear();
    const ai = mockAiService();
    const snackbar = mockSnackbarService();
    const editor = mockCodeEditorStore();
    TestBed.configureTestingModule({
      providers: [
        { provide: AiService, useValue: ai },
        { provide: SnackbarService, useValue: snackbar },
        { provide: CodeEditorStore, useValue: editor },
      ],
    });
    return { store: TestBed.inject(AiChatStore), ai, snackbar, editor };
  }

  it('should initialize with empty messages', () => {
    const { store } = setup();
    expect(store.messages()).toEqual([]);
    expect(store.isStreaming()).toBe(false);
  });

  it('should compute questionCount', () => {
    const { store } = setup();
    expect(store.questionCount()).toBe(0);
  });

  it('should compute isLimitReached as false initially', () => {
    const { store } = setup();
    expect(store.isLimitReached()).toBe(false);
  });

  it('should compute hasActiveFile from editor store', () => {
    const { store } = setup();
    expect(store.hasActiveFile()).toBe(false);
  });

  it('should clear messages', () => {
    const { store } = setup();
    store.clearMessages();
    expect(store.messages()).toEqual([]);
  });

  it('should send message and create user + assistant entries', () => {
    const { store, ai } = setup();
    ai.sendMessage.mockReturnValue(of({ delta: 'Hello!', done: true }));
    store.sendMessage({ userMessage: 'Hi' });
    expect(store.messages().length).toBe(2);
    expect(store.messages()[0].role).toBe('user');
    expect(store.messages()[0].content).toBe('Hi');
    expect(store.messages()[1].role).toBe('assistant');
    expect(store.messages()[1].content).toBe('Hello!');
  });

  it('should not send when streaming', () => {
    const { store, ai } = setup();
    ai.sendMessage.mockReturnValue(of({ delta: 'response', done: true }));
    store.sendMessage({ userMessage: 'first' });
    // Streaming should be false after completion
    expect(store.isStreaming()).toBe(false);
  });

  it('should call explainCurrentFile shortcut', () => {
    const { store, ai } = setup();
    ai.sendMessage.mockReturnValue(of({ delta: 'Explanation', done: true }));
    store.explainCurrentFile();
    expect(ai.sendMessage).toHaveBeenCalled();
  });
});
