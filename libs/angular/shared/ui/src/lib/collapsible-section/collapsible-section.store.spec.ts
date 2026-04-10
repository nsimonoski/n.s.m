import { TestBed } from '@angular/core/testing';
import { mockSnackbarService } from '@org/angular-testing';
import { SnackbarService } from '../snackbar/snackbar.service';
import { CollapsibleSectionStore } from './collapsible-section.store';

describe('CollapsibleSectionStore', () => {
  function setup() {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: SnackbarService, useValue: mockSnackbarService() }],
    });
    return TestBed.inject(CollapsibleSectionStore);
  }

  it('should default sections to collapsed', () => {
    const store = setup();
    expect(store.isCollapsed('explorer')).toBe(true);
  });

  it('should toggle section to expanded', () => {
    const store = setup();
    store.toggle('explorer');
    expect(store.isCollapsed('explorer')).toBe(false);
  });

  it('should toggle section back to collapsed', () => {
    const store = setup();
    store.toggle('explorer');
    store.toggle('explorer');
    expect(store.isCollapsed('explorer')).toBe(true);
  });

  it('should persist toggle state to localStorage', () => {
    const store = setup();
    store.toggle('git');
    const saved = JSON.parse(localStorage.getItem('collapsible-sections')!);
    expect(saved.sections.git).toBe(false);
  });

  it('should register and track section ids', () => {
    const store = setup();
    store.register('section-1');
    store.register('section-2');
    expect(store.registeredIds.has('section-1')).toBe(true);
    expect(store.registeredIds.has('section-2')).toBe(true);
  });

  it('should unregister section ids', () => {
    const store = setup();
    store.register('section-1');
    store.unregister('section-1');
    expect(store.registeredIds.has('section-1')).toBe(false);
  });
});
