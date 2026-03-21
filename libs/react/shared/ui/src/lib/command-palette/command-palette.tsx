import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './command-palette.scss';

export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface CommandPaletteProps {
  items: CommandPaletteItem[];
  placeholder?: string;
  loading?: boolean;
  onItemSelected: (item: CommandPaletteItem) => void;
  onSearchChanged?: (query: string) => void;
  onClose: () => void;
}

const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

export function CommandPalette({
  items,
  placeholder = 'Search...',
  loading = false,
  onItemSelected,
  onSearchChanged,
  onClose,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const activeIndex = Math.min(rawActiveIndex, Math.max(filteredItems.length - 1, 0));

  const prevItemsRef = useRef(filteredItems);
  if (prevItemsRef.current !== filteredItems) {
    prevItemsRef.current = filteredItems;
    if (rawActiveIndex !== 0) setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems.length > 0) {
          const item = filteredItems[activeIndex];
          if (!item.disabled) onItemSelected(item);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    onSearchChanged?.(value);
  }

  const handleItemClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-item-id]');
      if (!target) return;
      const item = filteredItems.find((it) => it.id === target.dataset.itemId);
      if (item && !item.disabled) onItemSelected(item);
    },
    [filteredItems, onItemSelected],
  );

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="command-palette-panel" onClick={stopPropagation}>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />

        {loading && <div className="status-message">Searching...</div>}

        <div className="results-list" onClick={handleItemClick}>
          {filteredItems.map((item, i) => (
            <div key={item.id}>
              {item.divider && <hr className="divider" />}
              <div
                data-item-id={item.id}
                className={`result-item${i === activeIndex ? ' active' : ''}${item.disabled ? ' disabled' : ''}`}
              >
                <span className="item-label">{item.label}</span>
                {item.description && <span className="item-description">{item.description}</span>}
              </div>
            </div>
          ))}

          {!loading && filteredItems.length === 0 && search && (
            <div className="status-message">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
