import { useEffect, useRef } from 'react';
import { DirectoryResponseDto, FileResponseDto } from '@org/shared/contracts';
import { useFileTreeContext } from '../file-tree.context';

interface FileTreeRenameNodeProps {
  node: DirectoryResponseDto | FileResponseDto;
}

export function FileTreeRenameNode({ node }: FileTreeRenameNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { onRename, onCancelRename } = useFileTreeContext();

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();

    const dotIndex = node.name.lastIndexOf('.');
    if (dotIndex > 0) {
      input.setSelectionRange(0, dotIndex);
    } else {
      input.select();
    }
  }, [node.name]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const newName = e.target.value.trim();
    if (newName && newName !== node.name) {
      onRename(node, newName);
    }
    onCancelRename();
  }

  return (
    <input
      ref={inputRef}
      className="inline-name-input"
      defaultValue={node.name}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
