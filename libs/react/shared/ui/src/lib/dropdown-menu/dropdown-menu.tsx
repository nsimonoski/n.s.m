import { useEffect, useRef, useState } from 'react';
import './dropdown-menu.scss';

export interface DropdownMenuItem {
  id: string;
  label: string;
  children?: DropdownMenuItem[];
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onAction: (id: string) => void;
}

export function DropdownMenu({ items, onAction }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  function handleAction(id: string) {
    onAction(id);
    setIsOpen(false);
  }

  function renderItems(menuItems: DropdownMenuItem[]) {
    return menuItems.map((item) => {
      if (item.children) {
        return (
          <div key={item.id} className="dropdown-group">
            {item.children.map((child) => (
              <button
                key={child.id}
                className="dropdown-item"
                onClick={() => handleAction(child.id)}
              >
                {child.label}
              </button>
            ))}
          </div>
        );
      }

      return (
        <button key={item.id} className="dropdown-item" onClick={() => handleAction(item.id)}>
          {item.label}
        </button>
      );
    });
  }

  return (
    <div className="dropdown-menu-wrapper" ref={ref}>
      <button className="trigger" onClick={() => setIsOpen((v) => !v)} title="More Actions">
        <i className="codicon codicon-ellipsis" />
      </button>
      {isOpen && <div className="dropdown">{renderItems(items)}</div>}
    </div>
  );
}
