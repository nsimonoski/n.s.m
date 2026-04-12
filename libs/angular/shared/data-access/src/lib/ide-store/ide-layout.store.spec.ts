import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { mockRouter, mockActivatedRoute, mockCodeEditorStore } from '@org/angular-testing';
import { IdeLayoutStore } from './ide-layout.store';
import { CodeEditorStore } from './code-editor.store';

describe('IdeLayoutStore', () => {
  function setup() {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
        { provide: CodeEditorStore, useValue: mockCodeEditorStore() },
      ],
    });
    return TestBed.inject(IdeLayoutStore);
  }

  it('should initialize with default state', () => {
    const store = setup();
    expect(store.sidebarOpen()).toBeDefined();
    expect(store.terminalOpen()).toBe(false);
    expect(store.terminalHeight()).toBe(250);
  });

  it('should toggle sidebar', () => {
    const store = setup();
    const initial = store.sidebarOpen();
    store.toggleSidebar();
    expect(store.sidebarOpen()).toBe(!initial);
  });

  it('should close sidebar', () => {
    const store = setup();
    store.toggleSidebar();
    store.closeSidebar();
    expect(store.sidebarOpen()).toBe(false);
  });

  it('should toggle terminal and persist', () => {
    const store = setup();
    store.toggleTerminal();
    expect(store.terminalOpen()).toBe(true);
    const saved = JSON.parse(localStorage.getItem('ide-layout') ?? '{}');
    expect(saved.terminalOpen).toBe(true);
  });

  it('should close terminal and persist', () => {
    const store = setup();
    store.toggleTerminal();
    store.closeTerminal();
    expect(store.terminalOpen()).toBe(false);
  });

  it('should clamp terminal height between 100 and 600', () => {
    const store = setup();
    store.setTerminalHeight(50);
    expect(store.terminalHeight()).toBe(100);
    store.setTerminalHeight(800);
    expect(store.terminalHeight()).toBe(600);
    store.setTerminalHeight(300);
    expect(store.terminalHeight()).toBe(300);
  });

  it('should save width to storage', () => {
    const store = setup();
    store.setWidth(400);
    const saved = JSON.parse(localStorage.getItem('ide-layout') ?? '{}');
    expect(saved.width).toBe(400);
  });
});
