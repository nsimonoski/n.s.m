import { useCodeEditorStore } from '@org/react-data-access';
import { TabBar } from '@org/react-ui';
import { MonacoEditor } from './monaco-editor/monaco-editor';
import './code-editor.scss';

export function CodeEditor() {
  const hasOpenFiles = useCodeEditorStore((s) => s.openFiles.length > 0);
  const isDirty = useCodeEditorStore((s) => {
    const active = s.openFiles.find((f) => f.path === s.activeTabId);
    return active?.isDirty ?? false;
  });

  const handleSave = () => {
    const { activeTabId, saveFile } = useCodeEditorStore.getState();
    if (activeTabId) saveFile(activeTabId);
  };

  return (
    <div className="code-editor">
      {hasOpenFiles ? (
        <>
          <TabBar />
          <MonacoEditor />
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-message">Open a file to start editing</span>
        </div>
      )}
      {isDirty && (
        <button className="save-fab" onClick={handleSave} aria-label="Save file">
          <svg viewBox="0 0 24 24"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"/></svg>
        </button>
      )}
    </div>
  );
}
