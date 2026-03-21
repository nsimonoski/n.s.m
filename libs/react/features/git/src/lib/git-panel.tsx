import { useCallback, useEffect, useRef, useState } from 'react';
import { DirectoryResponseDto, FileResponseDto, Enums, ContextMenu } from '@org/shared/contracts';
import { FileUtils, GitTreeUtils } from '@org/shared/utils';
import {
  useGitChangesStore,
  useGitWatcher,
  useAuthStore,
} from '@org/react-data-access';
import {
  FileTree,
  FileTreeHandle,
  ContextMenuPanel,
  ConfirmationDialog,
  CollapsibleSection,
  DropdownMenu,
  DropdownMenuItem,
} from '@org/react-ui';
import './git-panel.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

enum HeaderAction {
  StashAll = 'stash-all',
  StashPop = 'stash-pop',
  StashApply = 'stash-apply',
}

const HEADER_MENU_ITEMS: DropdownMenuItem[] = [
  {
    id: 'stash',
    label: 'Stash',
    children: [
      { id: HeaderAction.StashAll, label: 'Stash All Changes' },
      { id: HeaderAction.StashPop, label: 'Pop Stash' },
      { id: HeaderAction.StashApply, label: 'Apply Stash' },
    ],
  },
];

const STAGED_ACTIONS = [
  { id: ContextMenu.Action.UNSTAGE, icon: 'codicon-dash', tooltip: 'Unstage Changes' },
];

const CHANGES_ACTIONS = [
  { id: ContextMenu.Action.STAGE, icon: 'codicon-add', tooltip: 'Stage Changes' },
  { id: ContextMenu.Action.DISCARD, icon: 'codicon-discard', tooltip: 'Discard Changes' },
];

interface ContextMenuState {
  x: number;
  y: number;
  node: DirectoryResponseDto | FileResponseDto | null;
}

export function GitPanel() {
  const changesTree = useGitChangesStore((s) => s.changesTree);
  const statusMap = useGitChangesStore((s) => s.statusMap);
  const isLoading = useGitChangesStore((s) => s.isLoading);
  const rootPath = useAuthStore((s) => s.workspace?.rootPath ?? '');

  const fileTreeRef = useRef<FileTreeHandle>(null);
  const initialExpandDone = useRef(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingDiscardPaths, setPendingDiscardPaths] = useState<string[]>([]);

  useEffect(() => {
    if (!rootPath) return;
    initialExpandDone.current = false;
    useGitChangesStore.getState().getStatus();
  }, [rootPath]);

  useGitWatcher(rootPath || null);

  useEffect(() => {
    if (changesTree && fileTreeRef.current && !initialExpandDone.current) {
      fileTreeRef.current.expandPaths(FileUtils.collectDirectoryPaths(changesTree));
      initialExpandDone.current = true;
    }
  }, [changesTree]);

  const handleFileClick = useCallback((node: FileResponseDto) => {
    useGitChangesStore.getState().openDiff(GitTreeUtils.stripGitSectionPrefix(node.path));
  }, []);

  function handleHeaderAction(id: string) {
    const store = useGitChangesStore.getState();
    switch (id) {
      case HeaderAction.StashAll:
        store.stash();
        break;
      case HeaderAction.StashPop:
        store.stashPop();
        break;
      case HeaderAction.StashApply:
        store.stashApply();
        break;
    }
  }

  function handleAction(action: ContextMenu.Action, node: DirectoryResponseDto | FileResponseDto) {
    const paths = getFilePaths(node);

    switch (action) {
      case ContextMenu.Action.STAGE:
        useGitChangesStore.getState().stage(paths);
        break;
      case ContextMenu.Action.UNSTAGE:
        useGitChangesStore.getState().unstage(paths);
        break;
      case ContextMenu.Action.DISCARD:
        setPendingDiscardPaths(paths);
        setDiscardDialogOpen(true);
        break;
      case ContextMenu.Action.OPEN:
        if (node.type !== Enums.FileType.DIRECTORY) {
          useGitChangesStore
            .getState()
            .openDiff(GitTreeUtils.stripGitSectionPrefix(node.path));
        }
        break;
    }
  }

  function handleContextMenuAction(action: ContextMenu.Action) {
    const node = contextMenu?.node;
    setContextMenu(null);
    if (!node) return;
    handleAction(action, node);
  }

  function handleDiscardConfirmed() {
    useGitChangesStore.getState().discard(pendingDiscardPaths);
    setDiscardDialogOpen(false);
    setPendingDiscardPaths([]);
  }

  function renderNodeActions(node: DirectoryResponseDto | FileResponseDto) {
    const actions = node.path.startsWith('/staged')
      ? STAGED_ACTIONS
      : node.path.startsWith('/changes')
        ? CHANGES_ACTIONS
        : [];

    if (actions.length === 0) return null;

    return (
      <span className="node-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="action-btn"
            title={action.tooltip}
            onClick={(e) => {
              e.stopPropagation();
              handleAction(action.id as ContextMenu.Action, node);
            }}
          >
            <i className={`codicon ${action.icon}`} />
          </button>
        ))}
      </span>
    );
  }

  return (
    <div className="git-explorer">
      <CollapsibleSection
        id="git-changes"
        title="Changes"
        headerActions={<DropdownMenu items={HEADER_MENU_ITEMS} onAction={handleHeaderAction} />}
      >
        {isLoading && <div className="loading">Loading...</div>}

        {changesTree && (
          <FileTree
            ref={fileTreeRef}
            directory={changesTree}
            statusMap={statusMap}
            renderNodeActions={renderNodeActions}
            renamingNode={null}
            onCancelRename={noop}
            onOpen={handleFileClick}
            onExpand={noop}
            onRename={noop}
            onContextMenu={(x, y, node) => setContextMenu({ x, y, node })}
          />
        )}
      </CollapsibleSection>

      {contextMenu && (
        <ContextMenuPanel
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems()}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmationDialog
        isOpen={discardDialogOpen}
        title="Discard Changes"
        message="Are you sure you want to discard changes? This cannot be undone."
        onConfirm={handleDiscardConfirmed}
        onCancel={() => {
          setDiscardDialogOpen(false);
          setPendingDiscardPaths([]);
        }}
      />
    </div>
  );
}

function getMenuItems(): ContextMenu.Item[] {
  return [
    ContextMenu.GIT_ITEMS.STAGE,
    ContextMenu.GIT_ITEMS.UNSTAGE,
    ContextMenu.GIT_ITEMS.SEPARATOR,
    ContextMenu.GIT_ITEMS.DISCARD,
    ContextMenu.GIT_ITEMS.SEPARATOR,
    ContextMenu.GIT_ITEMS.OPEN,
  ];
}

function getFilePaths(node: DirectoryResponseDto | FileResponseDto): string[] {
  if (node.type !== Enums.FileType.DIRECTORY) {
    return [GitTreeUtils.stripGitSectionPrefix(node.path)];
  }
  const dir = node as DirectoryResponseDto;
  return [
    ...dir.files.map((f) => GitTreeUtils.stripGitSectionPrefix(f.path)),
    ...dir.directories.flatMap((d) => getFilePaths(d)),
  ];
}
