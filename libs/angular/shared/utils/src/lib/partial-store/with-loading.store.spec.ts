import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { withLoading } from './with-loading.store';

describe('withLoading', () => {
  const TestStore = signalStore({ providedIn: 'root' }, withState({ name: 'test' }), withLoading());

  function setup() {
    return TestBed.inject(TestStore);
  }

  it('should initialize with loading false and no error', () => {
    const store = setup();
    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBe('');
  });

  it('should set loading to true', () => {
    const store = setup();
    store.setLoading(true);
    expect(store.isLoading()).toBe(true);
  });

  it('should set loading to true by default when called without args', () => {
    const store = setup();
    store.setLoading();
    expect(store.isLoading()).toBe(true);
  });

  it('should set loading to false', () => {
    const store = setup();
    store.setLoading(true);
    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  it('should set error message', () => {
    const store = setup();
    store.setLoading(false, 'Something went wrong');
    expect(store.isLoading()).toBe(false);
    expect(store.errorMessage()).toBe('Something went wrong');
  });

  it('should clear error message when not provided', () => {
    const store = setup();
    store.setLoading(false, 'error');
    store.setLoading(true);
    expect(store.errorMessage()).toBeUndefined();
  });
});
