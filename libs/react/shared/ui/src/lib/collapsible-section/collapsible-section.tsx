import { useState, type ReactNode } from 'react';
import { browserStorage } from '@org/shared/utils';
import './collapsible-section.scss';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

const storage = browserStorage<Record<string, boolean>>('collapsible-sections');

export function CollapsibleSection({
  id,
  title,
  headerActions,
  children,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = storage.load();
    return stored?.[id] ?? false;
  });

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      const stored = storage.load() ?? {};
      storage.save({ ...stored, [id]: next });
      return next;
    });
  }

  return (
    <div className="collapsible-section">
      <div className="section-header">
        <div className="section-header-left" onClick={toggle}>
          <i
            className={`codicon ${collapsed ? 'codicon-chevron-right' : 'codicon-chevron-down'}`}
          />
          <span className="section-title">{title}</span>
        </div>
        {headerActions && (
          <div className="section-header-actions" onClick={(e) => e.stopPropagation()}>
            {headerActions}
          </div>
        )}
      </div>
      {!collapsed && <div className="section-content">{children}</div>}
    </div>
  );
}
