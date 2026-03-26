import type { OpenFile } from '../monaco-utils/monaco.contract';
import { Enums } from '@org/shared/contracts';
import {
  closeTab,
  closeOtherTabs,
  closeAllTabs,
  closeSavedTabs,
  closeTabsToTheRight,
} from './tab-manager';

function makeTab(tabId: string, overrides?: Partial<OpenFile>): OpenFile {
  return {
    tabId,
    path: `/${tabId}`,
    name: tabId,
    content: '',
    currentContent: '',
    originalContent: '',
    language: 'typescript',
    type: Enums.FileType.TS,
    mode: 'regular',
    isDirty: false,
    updatedAt: '',
    ...overrides,
  };
}

describe('closeTab', () => {
  const tabs = [makeTab('a'), makeTab('b'), makeTab('c')];

  it('should remove the closed tab and select next when active is closed', () => {
    const result = closeTab(tabs, 'b', 'b');
    expect(result.items).toHaveLength(2);
    expect(result.activeTabId).toBe('c');
  });

  it('should keep active tab when closing inactive', () => {
    const result = closeTab(tabs, 'b', 'a');
    expect(result.items).toHaveLength(2);
    expect(result.activeTabId).toBe('b');
  });

  it('should select previous when closing last tab in list', () => {
    const result = closeTab(tabs, 'c', 'c');
    expect(result.activeTabId).toBe('b');
  });

  it('should return null active when closing only tab', () => {
    const result = closeTab([makeTab('a')], 'a', 'a');
    expect(result.items).toHaveLength(0);
    expect(result.activeTabId).toBeNull();
  });
});

describe('closeOtherTabs', () => {
  it('should keep only the specified tab', () => {
    const tabs = [makeTab('a'), makeTab('b'), makeTab('c')];
    const result = closeOtherTabs(tabs, 'b');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tabId).toBe('b');
    expect(result.activeTabId).toBe('b');
  });
});

describe('closeAllTabs', () => {
  it('should return empty state', () => {
    const result = closeAllTabs();
    expect(result.items).toHaveLength(0);
    expect(result.activeTabId).toBeNull();
  });
});

describe('closeSavedTabs', () => {
  it('should keep only dirty tabs', () => {
    const tabs = [makeTab('a'), makeTab('b', { isDirty: true }), makeTab('c')];
    const result = closeSavedTabs(tabs, 'a');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tabId).toBe('b');
  });

  it('should keep active if still open', () => {
    const tabs = [makeTab('a', { isDirty: true }), makeTab('b', { isDirty: true })];
    const result = closeSavedTabs(tabs, 'b');
    expect(result.activeTabId).toBe('b');
  });

  it('should switch active to first dirty tab if current active is closed', () => {
    const tabs = [makeTab('a'), makeTab('b', { isDirty: true })];
    const result = closeSavedTabs(tabs, 'a');
    expect(result.activeTabId).toBe('b');
  });

  it('should return null active if no dirty tabs', () => {
    const tabs = [makeTab('a'), makeTab('b')];
    const result = closeSavedTabs(tabs, 'a');
    expect(result.activeTabId).toBeNull();
  });
});

describe('closeTabsToTheRight', () => {
  const tabs = [makeTab('a'), makeTab('b'), makeTab('c'), makeTab('d')];

  it('should keep tabs up to and including anchor', () => {
    const result = closeTabsToTheRight(tabs, 'c', 'b');
    expect(result.items).toHaveLength(2);
    expect(result.items.map((t) => t.tabId)).toEqual(['a', 'b']);
  });

  it('should keep active if it is to the left of anchor', () => {
    const result = closeTabsToTheRight(tabs, 'a', 'b');
    expect(result.activeTabId).toBe('a');
  });

  it('should switch to anchor if active is to the right', () => {
    const result = closeTabsToTheRight(tabs, 'd', 'b');
    expect(result.activeTabId).toBe('b');
  });
});
