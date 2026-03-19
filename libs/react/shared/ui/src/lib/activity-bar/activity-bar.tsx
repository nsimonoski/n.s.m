import { ActivityBarConfig } from '@org/shared/utils';
import { useIdeLayoutStore } from '@org/react-data-access';

export function ActivityBar() {
  const activePanel = useIdeLayoutStore((s) => s.activePanel);
  const setActivePanel = useIdeLayoutStore((s) => s.setActivePanel);

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
        </button>
      ))}
    </div>
  );
}
