import { memo, useCallback, useRef, useState } from 'react';
import { ContextMenu } from '@org/shared/contracts';
import { MonacoUtils } from '@org/shared/utils';
import { useCodeEditorStore } from '@org/react-data-access';
import { ContextMenuPanel } from '../context-menu/context-menu';
import './tab-bar.scss';

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

type ContextMenuSetter = (x: number, y: number, tabId: string) => void;

export function TabBar() {
  const openFiles = useCodeEditorStore((s) => s.openFiles);
  const activeTabId = useCodeEditorStore((s) => s.activeTabId);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const onContextMenuRef = useRef<ContextMenuSetter>((x, y, tabId) => {
    setContextMenu({ x, y, tabId });
  });

  const handleMenuAction = useCallback((action: ContextMenu.Action) => {
    setContextMenu((prev) => {
      const tabId = prev?.tabId;
      if (!tabId) return null;

      const store = useCodeEditorStore.getState();
      switch (action) {
        case ContextMenu.Action.CLOSE:
          store.closeFile(tabId);
          break;
        case ContextMenu.Action.CLOSE_OTHERS:
          store.closeOthers(tabId);
          break;
        case ContextMenu.Action.CLOSE_TO_THE_RIGHT:
          store.closeToTheRight(tabId);
          break;
        case ContextMenu.Action.CLOSE_SAVED:
          store.closeSaved();
          break;
        case ContextMenu.Action.CLOSE_ALL:
          store.closeAll();
          break;
      }
      return null;
    });
  }, []);

  const handleContextMenuClose = useCallback(() => setContextMenu(null), []);

  return (
    <>
      <div className="tab-bar">
        {openFiles.map((file) => (
          <Tab
            key={file.tabId}
            file={file}
            isActive={file.tabId === activeTabId}
            onContextMenuRef={onContextMenuRef}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenuPanel
          x={contextMenu.x}
          y={contextMenu.y}
          items={ContextMenu.TAB_ITEMS}
          onAction={handleMenuAction}
          onClose={handleContextMenuClose}
        />
      )}
    </>
  );
}

interface TabProps {
  file: MonacoUtils.OpenFile;
  isActive: boolean;
  onContextMenuRef: React.RefObject<ContextMenuSetter>;
}

const Tab = memo(function Tab({ file, isActive, onContextMenuRef }: TabProps) {
  function handleSelect() {
    useCodeEditorStore.getState().setActiveFile(file.tabId);
  }

  function handleClose(e: React.MouseEvent) {
    e.stopPropagation();
    useCodeEditorStore.getState().closeFile(file.tabId);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onContextMenuRef.current(e.clientX, e.clientY, file.tabId);
  }

  return (
    <div
      className={`tab${isActive ? ' active' : ''}`}
      onClick={handleSelect}
      onContextMenu={handleContextMenu}
    >
      <span className="tab-name">
        {file.name}
        {file.mode === 'diff' ? ' (diff)' : ''}
      </span>
      {file.isDirty && <span className="dirty-indicator" />}
      <button className="close-btn" onClick={handleClose} title="Close">
        <i className="codicon codicon-close" />
      </button>
    </div>
  );
});
