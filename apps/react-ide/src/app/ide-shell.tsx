import { useEffect } from 'react';
import { useAuthStore, useFileExplorerStore, useFileWatcher } from '@org/react-data-access';
import { CodeEditor } from '@org/react-code-editor';
import { FileExplorer } from '@org/react-file-explorer';

export function IdeShell() {
  const workspace = useAuthStore((s) => s.workspace);
  const directory = useFileExplorerStore((s) => s.directory);

  useEffect(() => {
    if (workspace?.rootPath) {
      useFileExplorerStore.getState().loadDirectory(workspace.rootPath);
    }
  }, [workspace?.rootPath]);

  useFileWatcher(directory?.path ?? null);

  return (
    <div className="ide-shell">
      <FileExplorer />
      <div className="editor-area">
        <CodeEditor />
      </div>
    </div>
  );
}
