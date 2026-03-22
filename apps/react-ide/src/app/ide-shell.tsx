import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAuthStore,
  useCodeEditorStore,
  useFileExplorerStore,
  useFileWatcher,
  useGitWatcher,
  useGitStatusStore,
  useIdeLayoutStore,
  useThemeStore,
} from '@org/react-data-access';
import { ResizeUtils } from '@org/shared/utils';
import { CodeEditor } from '@org/react-code-editor';
import { FileExplorer } from '@org/react-file-explorer';
import { GitPanel } from '@org/react-git';
import { AiChat } from '@org/react-ai-chat';
import { ActivityBar, Snackbar } from '@org/react-ui';
import { FileSearch, Footer } from '@org/react-ide';

function SidePanel({ sidebarOpen, children }: { sidebarOpen: boolean; children: React.ReactNode }) {
  const width = useIdeLayoutStore((s) => s.width);

  return (
    <div className={`panel-content${sidebarOpen ? ' mobile-open' : ''}`} style={{ width }}>
      {children}
    </div>
  );
}

export function IdeShell() {
  const workspace = useAuthStore((s) => s.workspace);
  const directory = useFileExplorerStore((s) => s.directory);
  const activePanel = useIdeLayoutStore((s) => s.activePanel);
  const sidebarOpen = useIdeLayoutStore((s) => s.sidebarOpen);
  const setWidth = useIdeLayoutStore((s) => s.setWidth);
  const closeSidebar = useIdeLayoutStore((s) => s.closeSidebar);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });
  const [showFileSearch, setShowFileSearch] = useState(false);

  useEffect(() => {
    useThemeStore.getState().initTheme();
  }, []);

  useEffect(() => {
    if (!workspace?.rootPath) return;

    async function initialize() {
      await useFileExplorerStore.getState().loadDirectory(workspace!.rootPath);
      if (useFileExplorerStore.getState().directory) {
        useCodeEditorStore.getState().restoreOpenFiles();
      }
      useGitStatusStore.getState().init();
    }

    initialize();
  }, [workspace?.rootPath]);

  useFileWatcher(directory?.path ?? null);
  useGitWatcher(workspace?.rootPath ?? null);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setShowFileSearch((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const closeFileSearch = useCallback(() => setShowFileSearch(false), []);

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: useIdeLayoutStore.getState().width };

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - resizeRef.current.startX;
        setWidth(ResizeUtils.clampPanelWidth(resizeRef.current.startWidth + delta));
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [setWidth],
  );

  return (
    <div className="ide-shell">
      <div className="explorer-shell">
        <div className="main-area">
          <ActivityBar />
          <div
            className={`mobile-backdrop${sidebarOpen ? ' visible' : ''}`}
            onClick={closeSidebar}
          />
          <SidePanel sidebarOpen={sidebarOpen}>
            {activePanel === 'explorer' && <FileExplorer />}
            {activePanel === 'git' && <GitPanel />}
            {activePanel === 'ai' && <AiChat />}
            <div className="resize-handle" onMouseDown={onResizeStart} />
          </SidePanel>
        </div>
        <Footer />
      </div>
      <div className="editor-area">
        <CodeEditor />
      </div>
      {showFileSearch && <FileSearch onClose={closeFileSearch} />}
      <Snackbar />
    </div>
  );
}
