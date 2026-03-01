import { useEffect } from 'react';
import { initFileExplorer, useFileExplorerStore, useFileWatcher } from '@org/react-data-access';
import { CodeEditor } from '@org/react-code-editor';
import { FileExplorer } from '@org/react-file-explorer';
import './app.scss';

export function App() {
  const directory = useFileExplorerStore((s) => s.directory);

  useEffect(() => {
    initFileExplorer();
  }, []);

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

export default App;
