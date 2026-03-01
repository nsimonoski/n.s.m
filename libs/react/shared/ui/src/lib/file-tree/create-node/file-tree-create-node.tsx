import { useEffect, useRef } from 'react';
import { Enums, ContextMenu } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';

interface FileTreeCreateNodeProps {
  level: number;
  inlineCreate: ContextMenu.InlineCreate;
  onConfirm: (event: ContextMenu.InlineCreateEvent) => void;
  onCancel: () => void;
}

export function FileTreeCreateNode({ level, inlineCreate, onConfirm, onCancel }: FileTreeCreateNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const icon =
    inlineCreate.type === Enums.FileType.DIRECTORY
      ? FileUtils.getFileIcon(Enums.FileType.DIRECTORY, false)
      : FileUtils.getFileIcon(Enums.FileType.OTHER, false);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const name = (e.target as HTMLInputElement).value.trim();
      if (name) {
        onConfirm({ parentPath: inlineCreate.parentPath, name, type: inlineCreate.type });
      }
      onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }

  function renderIndentGuides() {
    return Array(level)
      .fill(0)
      .map((_, i) => <span key={i} className="indent-guide" />);
  }

  return (
    <div className="create-node" onClick={(e) => e.stopPropagation()}>
      {renderIndentGuides()}
      <span className="expand-spacer" />
      <span className="file-icon" style={{ color: icon.color }}>
        <i className={`codicon ${icon.iconClass}`} />
      </span>
      <input
        ref={inputRef}
        className="inline-name-input"
        type="text"
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
      />
    </div>
  );
}
