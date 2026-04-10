import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import {
  mockFileExplorerService,
  mockAuthStore,
  mockSocketService,
  mockRouter,
  mockActivatedRoute,
} from '@org/angular-testing';
import { sockets } from '@org/angular-utils';
import { FileExplorerService } from '../file-explorer.service';
import { FileExplorerStore } from './file-explorer.store';
import { AuthStore } from './auth.store';

describe('FileExplorerStore', () => {
  function setup() {
    const fileService = mockFileExplorerService();
    const authStore = mockAuthStore();
    const socketService = mockSocketService();

    fileService.readDirectory.mockReturnValue(
      of({
        success: true,
        data: {
          path: '/workspace/repo',
          name: 'repo',
          type: 'directory',
          directories: [],
          files: [],
        },
        error: null,
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: FileExplorerService, useValue: fileService },
        { provide: AuthStore, useValue: authStore },
        { provide: sockets.SocketService, useValue: socketService },
        { provide: Router, useValue: mockRouter() },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
      ],
    });

    return { store: TestBed.inject(FileExplorerStore), fileService, socketService };
  }

  it('should initialize rootPath from AuthStore', () => {
    const { store } = setup();
    expect(store.rootPath()).toBe('/workspace/repo');
  });

  it('should load directory on init', () => {
    const { store } = setup();
    expect(store.directory()).toBeTruthy();
    expect(store.directory()!.path).toBe('/workspace/repo');
  });

  it('should get file and set in state', () => {
    const { store, fileService } = setup();
    const file = {
      id: '1',
      name: 'main.ts',
      path: '/workspace/repo/src/main.ts',
      content: 'test',
      type: 'file',
      extension: '.ts',
    };
    fileService.getFile.mockReturnValue(of({ success: true, data: file, error: null }));
    store.getFile('/workspace/repo/src/main.ts');
    expect(store.file()).toEqual(file);
  });

  it('should create file and refresh parent', () => {
    const { store, fileService } = setup();
    const newFile = {
      id: '2',
      name: 'new.ts',
      path: '/workspace/repo/src/new.ts',
      content: '',
      type: 'file',
      extension: '.ts',
    };
    fileService.createFile.mockReturnValue(of({ success: true, data: newFile, error: null }));
    fileService.readDirectory.mockReturnValue(
      of({
        success: true,
        data: {
          path: '/workspace/repo/src',
          name: 'src',
          type: 'directory',
          directories: [],
          files: [],
        },
        error: null,
      }),
    );
    store.createFile('/workspace/repo/src/new.ts');
    expect(store.file()).toEqual(newFile);
  });

  it('should delete file and refresh parent', () => {
    const { store, fileService } = setup();
    fileService.delete.mockReturnValue(
      of({ success: true, data: { path: '/workspace/repo/src/old.ts' }, error: null }),
    );
    fileService.readDirectory.mockReturnValue(
      of({
        success: true,
        data: {
          path: '/workspace/repo/src',
          name: 'src',
          type: 'directory',
          directories: [],
          files: [],
        },
        error: null,
      }),
    );
    store.delete('/workspace/repo/src/old.ts');
    expect(fileService.delete).toHaveBeenCalledWith('/workspace/repo/src/old.ts');
  });

  it('should rename and refresh parent', () => {
    const { store, fileService } = setup();
    const payload = {
      oldPath: '/workspace/repo/src/old.ts',
      newPath: '/workspace/repo/src/new.ts',
    };
    fileService.rename.mockReturnValue(
      of({ success: true, data: { path: '/workspace/repo/src/new.ts' }, error: null }),
    );
    fileService.readDirectory.mockReturnValue(
      of({
        success: true,
        data: {
          path: '/workspace/repo/src',
          name: 'src',
          type: 'directory',
          directories: [],
          files: [],
        },
        error: null,
      }),
    );
    store.rename(payload);
    expect(fileService.rename).toHaveBeenCalledWith(payload);
  });

  it('should watch for file changes via socket', () => {
    const { socketService } = setup();
    expect(socketService.watch).toHaveBeenCalled();
  });
});
