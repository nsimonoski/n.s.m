import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore, useFileExplorerStore, useFileWatcher } from '@org/react-data-access';
import { ResizeUtils } from '@org/shared/utils';
import { CodeEditor } from '@org/react-code-editor';
import { FileExplorer } from '@org/react-file-explorer';

export function IdeShell() {
  const workspace = useAuthStore((s) => s.workspace);
  const directory = useFileExplorerStore((s) => s.directory);
  const [panelWidth, setPanelWidth] = useState(ResizeUtils.loadPanelWidth);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });

  useEffect(() => {
    if (workspace?.rootPath) {
      useFileExplorerStore.getState().loadDirectory(workspace.rootPath);
    }
  }, [workspace?.rootPath]);

  useFileWatcher(directory?.path ?? null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: panelWidth };

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - resizeRef.current.startX;
        setPanelWidth(ResizeUtils.clampPanelWidth(resizeRef.current.startWidth + delta));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setPanelWidth((w) => {
          ResizeUtils.savePanelWidth(w);
          return w;
        });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [panelWidth],
  );

  return (
    <div className="ide-shell">
      <div className="panel-content" style={{ width: panelWidth }}>
        <FileExplorer />
        <div className="resize-handle" onMouseDown={onResizeStart} />
      </div>
      <div className="editor-area">
        <CodeEditor />
      </div>
    </div>
  );
}
