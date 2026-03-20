import { useEffect } from 'react';
import { FILE_CHANGE_EVENT, FILE_WATCH_EVENT, FileChangeEvent } from '@org/shared/contracts';
import { socketService } from '../services/socket.service';
import { useFileExplorerStore } from '../stores/file-explorer.store';
import { useCodeEditorStore } from '../stores/code-editor.store';
import { fileExplorerService } from '../services/file-explorer.service';

export function useFileWatcher(path: string | null): void {
  useEffect(() => {
    if (!path) return;

    socketService.watch(FILE_WATCH_EVENT, path);

    const unsubscribe = socketService.on<FileChangeEvent>(FILE_CHANGE_EVENT, (event) => {
      useFileExplorerStore.getState().refreshParentDirectory(event.path);
      refreshOpenFile(event);
    });

    return unsubscribe;
  }, [path]);
}

async function refreshOpenFile(event: FileChangeEvent): Promise<void> {
  if (event.type !== 'change') return;

  const { openFiles } = useCodeEditorStore.getState();
  const isOpen = openFiles.some((f) => f.path === event.path);
  if (!isOpen) return;

  const { success, data } = await fileExplorerService.getFile(event.path);
  if (!success) return;

  const content = data.content ?? '';

  useCodeEditorStore.setState({
    openFiles: useCodeEditorStore
      .getState()
      .openFiles.map((f) =>
        f.path === data.path
          ? { ...f, content, currentContent: content, isDirty: false, updatedAt: data.updatedAt }
          : f,
      ),
  });
}
