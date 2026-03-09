import { createContext, useContext } from 'react';
import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';

export interface FileTreeContextValue {
  expandedPaths: Set<string>;
  selectedPath: string | null;
  statusMap: Record<string, string>;
  renderCreateNode: ((level: number, parentPath: string) => React.ReactNode) | null;
  renamingNode: DirectoryResponseDto | FileResponseDto | null;
  onToggleExpand: (node: DirectoryResponseDto) => void;
  onSelect: (node: DirectoryResponseDto | FileResponseDto) => void;
  onOpen: (node: FileResponseDto) => void;
  onExpand: (node: DirectoryResponseDto) => void;
  onRename: (node: DirectoryResponseDto | FileResponseDto, newName: string) => void;
  onCancelRename: () => void;
  onContextMenu: (e: React.MouseEvent, node: DirectoryResponseDto | FileResponseDto) => void;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

export const FileTreeProvider = FileTreeContext.Provider;

export function useFileTreeContext(): FileTreeContextValue {
  const ctx = useContext(FileTreeContext);
  if (!ctx) {
    throw new Error('useFileTreeContext must be used within a FileTreeProvider');
  }
  return ctx;
}
