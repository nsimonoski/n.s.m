export const MIN_PANEL_WIDTH = 200;
export const MAX_PANEL_WIDTH = 600;
export const DEFAULT_PANEL_WIDTH = 300;
export const PANEL_STORAGE_KEY = 'ide-layout';

export function clampPanelWidth(width: number): number {
  return Math.min(Math.max(width, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
}

export function loadPanelWidth(): number {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (!raw) return DEFAULT_PANEL_WIDTH;
    return JSON.parse(raw).width ?? DEFAULT_PANEL_WIDTH;
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
}

export function savePanelWidth(width: number): void {
  localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify({ width }));
}
