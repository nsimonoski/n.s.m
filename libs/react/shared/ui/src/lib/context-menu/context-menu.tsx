import { ContextMenu } from '@org/shared/contracts';
import './context-menu.scss';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenu.Item[];
  onAction: (action: ContextMenu.Action) => void;
  onClose: () => void;
}

export function ContextMenuPanel({ x, y, items, onAction, onClose }: ContextMenuProps) {
  function renderItem(item: ContextMenu.Item, index: number) {
    if (item.separator) {
      return <div key={index} className="separator" />;
    }

    return (
      <div
        key={item.action}
        className={`menu-item${item.disabled ? ' disabled' : ''}`}
        onClick={() => {
          if (!item.disabled) onAction(item.action as ContextMenu.Action);
        }}
      >
        {item.icon && <span className="icon">{item.icon}</span>}
        <span className="label">{item.label}</span>
      </div>
    );
  }

  return (
    <>
      <div className="context-menu-backdrop" onClick={onClose} />
      <div className="context-menu" style={{ left: x, top: y }}>
        {items.map(renderItem)}
      </div>
    </>
  );
}
