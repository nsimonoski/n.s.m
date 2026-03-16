import { useCodeEditorStore } from '@org/react-data-access';
import { TabBar } from '@org/react-ui';
import { MonacoEditor } from './monaco-editor/monaco-editor';
import './code-editor.scss';

export function CodeEditor() {
  const openFiles = useCodeEditorStore((s) => s.openFiles);

  return (
    <div className="code-editor">
      {openFiles.length > 0 ? (
        <>
          <TabBar />
          <MonacoEditor />
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-message">Open a file to start editing</span>
        </div>
      )}
    </div>
  );
}
