import { useEffect, useRef } from 'react';
import { MonacoUtils } from '@org/shared/utils';
import { useCodeEditorStore } from '@org/react-data-access';
import './monaco-editor.scss';

export function MonacoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTabId = useCodeEditorStore((s) => s.activeTabId);

  useEffect(() => {
    MonacoUtils.editorUtils.loadMonaco().then(() => {
      if (containerRef.current && !MonacoUtils.editorUtils.isReady) {
        MonacoUtils.editorUtils.create(containerRef.current, handleSave);
        const { openFiles, activeTabId } = useCodeEditorStore.getState();
        const file = openFiles.find((f) => f.tabId === activeTabId) ?? null;
        MonacoUtils.editorUtils.switchToFile(file, handleContentChange);
      }
    });
  }, []);

  useEffect(() => {
    const { openFiles } = useCodeEditorStore.getState();
    const file = openFiles.find((f) => f.tabId === activeTabId) ?? null;
    MonacoUtils.editorUtils.switchToFile(file, handleContentChange);
  }, [activeTabId]);

  return <div ref={containerRef} className="editor-container" />;
}

function handleSave(): void {
  const { activeTabId, openFiles, saveFile } = useCodeEditorStore.getState();
  const activeFile = openFiles.find((f) => f.tabId === activeTabId);
  if (activeFile) saveFile(activeFile.path);
}

function handleContentChange(path: string, value: string): void {
  useCodeEditorStore.getState().updateContent(path, value);
}
