import { useState } from 'react';
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

export function TabBar() {
  const openFiles = useCodeEditorStore((s) => s.openFiles);
  const activeTabId = useCodeEditorStore((s) => s.activeTabId);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  function handleClose(e: React.MouseEvent, tabId: string) {
    e.stopPropagation();
    useCodeEditorStore.getState().closeFile(tabId);
  }

  function handleContextMenu(e: React.MouseEvent, tabId: string) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  }

  function handleMenuAction(action: ContextMenu.Action) {
    const tabId = contextMenu?.tabId;
    setContextMenu(null);
    if (!tabId) return;

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
  }

  return (
    <>
      <div className="tab-bar">
        {openFiles.map((file) => (
          <Tab
            key={file.tabId}
            file={file}
            isActive={file.tabId === activeTabId}
            onSelect={() => useCodeEditorStore.getState().setActiveFile(file.tabId)}
            onClose={(e) => handleClose(e, file.tabId)}
            onContextMenu={(e) => handleContextMenu(e, file.tabId)}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenuPanel
          x={contextMenu.x}
          y={contextMenu.y}
          items={ContextMenu.TAB_ITEMS}
          onAction={handleMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

interface TabProps {
  file: MonacoUtils.OpenFile;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function Tab({ file, isActive, onSelect, onClose, onContextMenu }: TabProps) {
  return (
    <div
      className={`tab${isActive ? ' active' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <span className="tab-name">
        {file.name}
        {file.mode === 'diff' ? ' (diff)' : ''}
      </span>
      {file.isDirty && <span className="dirty-indicator" />}
      <button className="close-btn" onClick={onClose} title="Close">
        <i className="codicon codicon-close" />
      </button>
    </div>
  );
}
