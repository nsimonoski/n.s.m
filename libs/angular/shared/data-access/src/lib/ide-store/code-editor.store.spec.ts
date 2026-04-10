import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import {
  mockFileExplorerService,
  mockWebSocketStore,
  mockRouter,
  mockActivatedRoute,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { FileExplorerService } from '../file-explorer.service';
import { CodeEditorStore } from './code-editor.store';

describe('CodeEditorStore', () => {
  function setup() {
    localStorage.clear();
    const fileService = mockFileExplorerService();
    const ws = mockWebSocketStore();
    TestBed.configureTestingModule({
      providers: [
        { provide: FileExplorerService, useValue: fileService },
        { provide: sockets.WebSocketStore, useValue: ws },
        { provide: Router, useValue: mockRouter() },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
      ],
    });
    return { store: TestBed.inject(CodeEditorStore), fileService, ws };
  }

  const testFile = {
    id: '1',
    name: 'main.ts',
    path: '/workspace/repo/src/main.ts',
    content: 'console.log("hello")',
    type: 'file',
    extension: '.ts',
    updatedAt: '2024-01-01',
  };

  it('should initialize with empty state', () => {
    const { store } = setup();
    expect(store.openFiles()).toEqual([]);
    expect(store.activeTabId()).toBeNull();
    expect(store.activeFile()).toBeNull();
  });

  it('should open a file and set it as active', () => {
    const { store } = setup();
    store.openFile(testFile);
    expect(store.openFiles().length).toBe(1);
    expect(store.openFiles()[0].path).toBe(testFile.path);
  });

  it('should not duplicate file when opening same path', () => {
    const { store } = setup();
    store.openFile(testFile);
    store.openFile(testFile);
    expect(store.openFiles().length).toBe(1);
  });

  it('should close a file', () => {
    const { store } = setup();
    store.openFile(testFile);
    const tabId = store.openFiles()[0].tabId;
    store.closeFile(tabId);
    expect(store.openFiles().length).toBe(0);
  });

  it('should close all files', () => {
    const { store } = setup();
    store.openFile(testFile);
    store.openFile({ ...testFile, id: '2', name: 'app.ts', path: '/workspace/repo/src/app.ts' });
    store.closeAll();
    expect(store.openFiles().length).toBe(0);
  });

  it('should update content and mark dirty', () => {
    const { store } = setup();
    store.openFile(testFile);
    store.updateContent(testFile.path, 'console.log("updated")');
    const file = store.openFiles()[0];
    expect(file.currentContent).toBe('console.log("updated")');
    expect(file.isDirty).toBe(true);
  });

  it('should mark file as not dirty when content matches original', () => {
    const { store } = setup();
    store.openFile(testFile);
    store.updateContent(testFile.path, 'changed');
    store.updateContent(testFile.path, testFile.content);
    expect(store.openFiles()[0].isDirty).toBe(false);
  });

  it('should save file via service', () => {
    const { store, fileService } = setup();
    store.openFile(testFile);
    store.updateContent(testFile.path, 'new content');
    fileService.updateFile.mockReturnValue(
      of({ success: true, data: { ...testFile, content: 'new content' }, error: null }),
    );
    store.saveFile(testFile.path);
    const file = store.openFiles()[0];
    expect(file.isDirty).toBe(false);
    expect(fileService.updateFile).toHaveBeenCalled();
  });

  it('should open diff view', () => {
    const { store } = setup();
    store.openDiff(testFile, 'original content');
    expect(store.openFiles().length).toBe(1);
    expect(store.openFiles()[0].mode).toBe('diff');
    expect(store.openFiles()[0].originalContent).toBe('original content');
  });

  it('should set active file', () => {
    const { store } = setup();
    store.openFile(testFile);
    const secondFile = { ...testFile, id: '2', name: 'app.ts', path: '/workspace/repo/src/app.ts' };
    store.openFile(secondFile);
    const firstTabId = store.openFiles()[0].tabId;
    store.setActiveFile(firstTabId);
    expect(store.activeTabId()).toBe(firstTabId);
  });
});
