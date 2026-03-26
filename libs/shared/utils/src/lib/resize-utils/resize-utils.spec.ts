import { clampPanelWidth, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH, DEFAULT_PANEL_WIDTH } from './resize-utils';

describe('clampPanelWidth', () => {
  it('should clamp below min to min', () => {
    expect(clampPanelWidth(100)).toBe(MIN_PANEL_WIDTH);
  });

  it('should clamp above max to max', () => {
    expect(clampPanelWidth(1000)).toBe(MAX_PANEL_WIDTH);
  });

  it('should return value within range unchanged', () => {
    expect(clampPanelWidth(350)).toBe(350);
  });

  it('should return min when given min', () => {
    expect(clampPanelWidth(MIN_PANEL_WIDTH)).toBe(MIN_PANEL_WIDTH);
  });

  it('should return max when given max', () => {
    expect(clampPanelWidth(MAX_PANEL_WIDTH)).toBe(MAX_PANEL_WIDTH);
  });
});

describe('constants', () => {
  it('should export expected values', () => {
    expect(MIN_PANEL_WIDTH).toBe(200);
    expect(MAX_PANEL_WIDTH).toBe(600);
    expect(DEFAULT_PANEL_WIDTH).toBe(300);
  });
});
