export const MIN_PANEL_WIDTH = 200;
export const MAX_PANEL_WIDTH = 600;
export const DEFAULT_PANEL_WIDTH = 300;

export function clampPanelWidth(width: number): number {
  return Math.min(Math.max(width, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
}
