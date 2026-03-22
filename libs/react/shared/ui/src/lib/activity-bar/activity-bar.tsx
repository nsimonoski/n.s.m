import { ActivityBarConfig } from '@org/shared/utils';
import { useIdeLayoutStore, useGitStatusStore } from '@org/react-data-access';

export function ActivityBar() {
  const activePanel = useIdeLayoutStore((s) => s.activePanel);
  const setActivePanel = useIdeLayoutStore((s) => s.setActivePanel);
  const changeCount = useGitStatusStore((s) => s.stagedCount + s.changesCount);

  return (
    <div className="activity-bar">
      {ActivityBarConfig.panels.map((panel) => (
        <button
          key={panel.id}
          className={`activity-bar-item${activePanel === panel.id ? ' active' : ''}`}
          title={panel.tooltip}
          onClick={() => setActivePanel(panel.id)}
        >
          <img className="icon" src={panel.icon} alt={panel.tooltip} />
          {panel.id === 'git' && changeCount > 0 && (
            <span className="badge">{changeCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
