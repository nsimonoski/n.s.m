import { panels, explorer, git, ai, terminal, type PanelDefinition } from './activity-bar';

describe('activity-bar panels', () => {
  it('should export 3 panels in the array', () => {
    expect(panels).toHaveLength(3);
  });

  it('should contain explorer, git, and ai in order', () => {
    expect(panels.map((p) => p.id)).toEqual(['explorer', 'git', 'ai']);
  });

  it.each([explorer, git, ai, terminal])('panel "$id" should have required fields', (panel: PanelDefinition) => {
    expect(panel.id).toBeTruthy();
    expect(panel.icon).toBeTruthy();
    expect(panel.tooltip).toBeTruthy();
  });

  it('should export terminal as a standalone panel', () => {
    expect(terminal.id).toBe('terminal');
    expect(terminal.icon).toContain('terminal');
  });
});
