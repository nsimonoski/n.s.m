import { useCallback, useState } from 'react';
import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { useFileExplorerStore, useCodeEditorStore } from '@org/react-data-access';
import {
  FileTree,
  FileTreeCreateNode,
  ContextMenuPanel,
  ConfirmationDialog,
} from '@org/react-ui';
import './file-explorer.scss';

interface ContextMenuState {
  x: number;
  y: number;
  node: DirectoryResponseDto | FileResponseDto | null;
}

interface DialogState {
  title: string;
  message: string;
  path: string;
}

export function FileExplorer() {
  const directory = useFileExplorerStore((s) => s.directory);
  const loading = useFileExplorerStore((s) => s.loading);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inlineCreate, setInlineCreate] = useState<ContextMenu.InlineCreate | null>(null);
  const [renamingNode, setRenamingNode] = useState<DirectoryResponseDto | FileResponseDto | null>(
    null,
  );

  const handleNodeOpen = useCallback((node: FileResponseDto) => {
    useCodeEditorStore.getState().fetchAndOpenFile(node.path);
  }, []);

  const renderCreateNode = useCallback(
    (level: number, parentPath: string) =>
      inlineCreate?.parentPath === parentPath ? (
        <FileTreeCreateNode
          level={level}
          inlineCreate={inlineCreate}
          onConfirm={(event: ContextMenu.InlineCreateEvent) => {
            const fullPath = `${event.parentPath}/${event.name}`;
            const store = useFileExplorerStore.getState();
            if (event.type === 'directory') {
              store.createDirectory(fullPath);
            } else {
              store.createFile(fullPath);
            }
            setInlineCreate(null);
          }}
          onCancel={() => setInlineCreate(null)}
        />
      ) : null,
    [inlineCreate],
  );

  const handleExpand = useCallback((node: DirectoryResponseDto) => {
    useFileExplorerStore.getState().expandDirectory(node.path);
  }, []);

  const handleRename = useCallback((event: ContextMenu.InlineRenameEvent) => {
    useFileExplorerStore.getState().rename({ path: event.node.path, newName: event.newName });
  }, []);

  const handleContextMenuOpen = useCallback(
    (x: number, y: number, node: DirectoryResponseDto | FileResponseDto | null) => {
      setContextMenu({ x, y, node });
    },
    [],
  );

  const handleCancelRename = useCallback(() => setRenamingNode(null), []);

  if (loading) return <div className="loading">Loading...</div>;
  if (!directory) return null;

  function handleContextMenuAction(action: ContextMenu.Action) {
    const node = contextMenu?.node ?? null;
    setContextMenu(null);
    if (!directory) return;

    switch (action) {
      case ContextMenu.Action.NEW_FILE:
        setInlineCreate(ContextMenu.startInlineCreate(node, 'file', directory.path));
        break;
      case ContextMenu.Action.NEW_FOLDER:
        setInlineCreate(ContextMenu.startInlineCreate(node, 'directory', directory.path));
        break;
      case ContextMenu.Action.RENAME:
        if (node) setRenamingNode(node);
        break;
      case ContextMenu.Action.DELETE:
        if (node) {
          setDialog({
            title: `Delete ${node.type}`,
            message: `Are you sure you want to delete ${node.name}?`,
            path: node.path,
          });
        }
        break;
      case ContextMenu.Action.OPEN:
        if (node && node.type !== Enums.FileType.DIRECTORY) {
          handleNodeOpen(node as FileResponseDto);
        }
        break;
    }
  }

  function handleConfirmDelete() {
    if (dialog) {
      useFileExplorerStore.getState().deleteNode(dialog.path);
      setDialog(null);
    }
  }

  return (
    <div className="file-explorer">
      <FileTree
        directory={directory}
        renderCreateNode={renderCreateNode}
        renamingNode={renamingNode}
        onCancelRename={handleCancelRename}
        onOpen={handleNodeOpen}
        onExpand={handleExpand}
        onRename={handleRename}
        onContextMenu={handleContextMenuOpen}
      />

      {contextMenu && (
        <ContextMenuPanel
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems(contextMenu.node)}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}

function getMenuItems(node: DirectoryResponseDto | FileResponseDto | null): ContextMenu.Item[] {
  if (!node) {
    return [ContextMenu.ITEMS.NEW_FILE, ContextMenu.ITEMS.NEW_FOLDER];
  }

  if (node.type === Enums.FileType.DIRECTORY) {
    return [
      ContextMenu.ITEMS.NEW_FILE,
      ContextMenu.ITEMS.NEW_FOLDER,
      ContextMenu.ITEMS.SEPARATOR,
      ContextMenu.ITEMS.RENAME,
      ContextMenu.ITEMS.DELETE,
    ];
  }

  return [
    ContextMenu.ITEMS.OPEN,
    ContextMenu.ITEMS.SEPARATOR,
    ContextMenu.ITEMS.RENAME,
    ContextMenu.ITEMS.DELETE,
  ];
}
