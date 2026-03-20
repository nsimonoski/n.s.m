import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { DirectoryResponseDto, FileResponseDto, ContextMenu } from '@org/shared/contracts';
import { FileTreeProvider, FileTreeContextValue } from './file-tree.context';
import { FileTreeNode } from './node/file-tree-node';
import './file-tree.scss';

interface FileTreeProps {
  directory: DirectoryResponseDto;
  statusMap?: Record<string, string>;
  renderCreateNode?: (level: number, parentPath: string) => React.ReactNode;
  renderNodeActions?: (node: DirectoryResponseDto | FileResponseDto) => React.ReactNode | null;
  renamingNode: DirectoryResponseDto | FileResponseDto | null;
  onCancelRename: () => void;
  onOpen: (node: FileResponseDto) => void;
  onExpand: (node: DirectoryResponseDto) => void;
  onRename: (event: ContextMenu.InlineRenameEvent) => void;
  onContextMenu: (
    x: number,
    y: number,
    node: DirectoryResponseDto | FileResponseDto | null,
  ) => void;
}

export interface FileTreeHandle {
  expandPaths: (paths: string[]) => void;
  selectNode: (path: string | null) => void;
}

export const FileTree = forwardRef<FileTreeHandle, FileTreeProps>(function FileTree(
  {
    directory,
    statusMap = {},
    renderCreateNode,
    renderNodeActions,
    renamingNode,
    onCancelRename,
    onOpen,
    onExpand,
    onRename,
    onContextMenu,
  },
  ref,
) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    expandPaths(paths: string[]) {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        paths.forEach((p) => next.add(p));
        return next;
      });
    },
    selectNode(path: string | null) {
      setSelectedPath(path);
    },
  }));

  const contextValue = useMemo<FileTreeContextValue>(
    () => ({
      expandedPaths,
      selectedPath,
      statusMap,
      renderCreateNode: renderCreateNode ?? null,
      renderNodeActions: renderNodeActions ?? null,
      renamingNode,
      onToggleExpand(node: DirectoryResponseDto) {
        setExpandedPaths((prev) => {
          const next = new Set(prev);
          next.has(node.path) ? next.delete(node.path) : next.add(node.path);
          return next;
        });
      },
      onSelect(node: DirectoryResponseDto | FileResponseDto) {
        setSelectedPath(node.path);
      },
      onOpen,
      onExpand,
      onRename: (node, newName) => onRename({ node, newName }),
      onCancelRename,
      onContextMenu: (e, node) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e.clientX, e.clientY, node);
      },
    }),
    [
      expandedPaths,
      selectedPath,
      statusMap,
      renderCreateNode,
      renderNodeActions,
      renamingNode,
      onOpen,
      onExpand,
      onRename,
      onCancelRename,
      onContextMenu,
    ],
  );

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e.clientX, e.clientY, null);
  }

  const rootNodes = [...directory.directories, ...directory.files];

  return (
    <FileTreeProvider value={contextValue}>
      <div className="file-tree-container">
        <div className="file-tree" onContextMenu={handleContextMenu}>
          {renderCreateNode && renderCreateNode(0, directory.path)}
          {rootNodes.map((node) => (
            <FileTreeNode key={node.path} node={node} level={0} />
          ))}
        </div>
      </div>
    </FileTreeProvider>
  );
});
