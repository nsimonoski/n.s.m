import { useEffect, useRef } from 'react';
import { MonacoUtils } from '@org/shared/utils';
import { useCodeEditorStore } from '@org/react-data-access';
import './monaco-editor.scss';

export function MonacoEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFile = useCodeEditorStore((s) => {
    const path = s.activeFilePath;
    return s.openFiles.find((f) => f.path === path) ?? null;
  });

  useEffect(() => {
    MonacoUtils.editorUtils.loadMonaco().then(() => {
      if (containerRef.current && !MonacoUtils.editorUtils.isReady) {
        MonacoUtils.editorUtils.create(containerRef.current, handleSave);
      }
    });
  }, []);

  useEffect(() => {
    MonacoUtils.editorUtils.switchToFile(activeFile, handleContentChange);
  }, [activeFile?.path]);

  return <div ref={containerRef} className="editor-container" />;
}

function handleSave(): void {
  const { activeFilePath, saveFile } = useCodeEditorStore.getState();
  if (activeFilePath) saveFile(activeFilePath);
}

function handleContentChange(path: string, value: string): void {
  useCodeEditorStore.getState().updateContent(path, value);
}
