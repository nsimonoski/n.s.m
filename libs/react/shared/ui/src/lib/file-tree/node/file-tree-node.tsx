import { DirectoryResponseDto, FileResponseDto, Enums } from '@org/shared/contracts';
import { FileUtils } from '@org/shared/utils';
import { useFileTreeContext } from '../file-tree.context';
import { FileTreeRenameNode } from './file-tree-rename-node';

interface FileTreeNodeProps {
  node: DirectoryResponseDto | FileResponseDto;
  level: number;
}

export function FileTreeNode({ node, level }: FileTreeNodeProps) {
  const ctx = useFileTreeContext();

  const isDirectory = node.type === Enums.FileType.DIRECTORY;
  const isExpanded = ctx.expandedPaths.has(node.path);
  const icon = FileUtils.getFileIcon(node.type, isExpanded);
  const status = ctx.statusMap[node.path];

  function handleClick() {
    ctx.onSelect(node);

    if (isDirectory) {
      const dir = node as DirectoryResponseDto;
      ctx.onToggleExpand(dir);

      if (
        !ctx.expandedPaths.has(node.path) &&
        dir.files.length === 0 &&
        dir.directories.length === 0
      ) {
        ctx.onExpand(dir);
      }
    } else {
      ctx.onOpen(node as FileResponseDto);
    }
  }

  function renderIndentGuides() {
    return Array(level)
      .fill(0)
      .map((_, i) => <span key={i} className="indent-guide" />);
  }

  function renderExpandIcon() {
    if (isDirectory) {
      return (
        <span className="expand-icon">
          <i className={`codicon ${FileUtils.getExpandIcon(isExpanded)}`} />
        </span>
      );
    }
    return <span className="expand-spacer" />;
  }

  function renderName() {
    if (ctx.renamingNode?.path === node.path) {
      return <FileTreeRenameNode node={node} />;
    }

    return (
      <>
        <span className="name">{node.name}</span>
        {status && <span className={`status-badge status-${status}`}>{status}</span>}
      </>
    );
  }

  function renderChildren() {
    if (!isDirectory || !isExpanded) return null;

    const dir = node as DirectoryResponseDto;
    const children = [...dir.directories, ...dir.files];

    return (
      <>
        {ctx.renderCreateNode && ctx.renderCreateNode(level + 1, node.path)}
        {children.map((child) => (
          <FileTreeNode key={child.path} node={child} level={level + 1} />
        ))}
      </>
    );
  }

  return (
    <>
      <div
        className={`tree-node${ctx.selectedPath === node.path ? ' selected' : ''}${node.gitIgnored ? ' grayed' : ''}`}
        onClick={handleClick}
        onContextMenu={(e) => ctx.onContextMenu(e, node)}
      >
        {renderIndentGuides()}
        {renderExpandIcon()}
        <span className="file-icon" style={{ color: icon.color }}>
          <i className={`codicon ${icon.iconClass}`} />
        </span>
        {renderName()}
        {ctx.renderNodeActions && ctx.renderNodeActions(node)}
      </div>
      {renderChildren()}
    </>
  );
}
