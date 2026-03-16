import type { OpenFile } from '../monaco-utils/monaco.contract';

export interface TabState {
  items: OpenFile[];
  activeTabId: string | null;
}

export function closeTab(
  items: OpenFile[],
  activeTabId: string | null,
  closedTabId: string,
): TabState {
  const remaining = items.filter((item) => item.tabId !== closedTabId);

  let newActiveTabId = activeTabId;
  if (activeTabId === closedTabId) {
    const closedIndex = items.findIndex((item) => item.tabId === closedTabId);
    newActiveTabId = remaining[Math.min(closedIndex, remaining.length - 1)]?.tabId ?? null;
  }

  return { items: remaining, activeTabId: newActiveTabId };
}

export function closeOtherTabs(items: OpenFile[], keepTabId: string): TabState {
  return { items: items.filter((item) => item.tabId === keepTabId), activeTabId: keepTabId };
}

export function closeAllTabs(): TabState {
  return { items: [], activeTabId: null };
}

export function closeSavedTabs(items: OpenFile[], activeTabId: string | null): TabState {
  const dirty = items.filter((item) => item.isDirty);
  const activeStillOpen = dirty.some((item) => item.tabId === activeTabId);
  const newActiveTabId = activeStillOpen ? activeTabId : (dirty[0]?.tabId ?? null);

  return { items: dirty, activeTabId: newActiveTabId };
}

export function closeTabsToTheRight(
  items: OpenFile[],
  activeTabId: string | null,
  anchorTabId: string,
): TabState {
  const idx = items.findIndex((item) => item.tabId === anchorTabId);
  const kept = items.slice(0, idx + 1);
  const activeStillOpen = kept.some((item) => item.tabId === activeTabId);
  const newActiveTabId = activeStillOpen ? activeTabId : anchorTabId;

  return { items: kept, activeTabId: newActiveTabId };
}
