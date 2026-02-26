import { useEffect } from 'react';
import {
  fileExplorerService,
  initFileExplorer,
  useCodeEditorStore,
  useFileExplorerStore,
  useFileWatcher,
} from '@org/react-data-access';
import { CodeEditor } from '@org/react-code-editor';
import './app.scss';

const DEFAULT_FILE = '/Users/nsm/Desktop/repos/n.s.m/apps/react-ide/src/app/app.tsx';

export function App() {
  const directory = useFileExplorerStore((s) => s.directory);

  useEffect(() => {
    initFileExplorer();
    openDefaultFile();
  }, []);

  useFileWatcher(directory?.path ?? null);

  return (
    <div className="ide-shell">
      <div className="sidebar-placeholder" />
      <div className="editor-area">
        <CodeEditor />
      </div>
    </div>
  );
}

export default App;

async function openDefaultFile(): Promise<void> {
  const file = await fileExplorerService.getFile(DEFAULT_FILE);
  useCodeEditorStore.getState().openFile(file);
}
