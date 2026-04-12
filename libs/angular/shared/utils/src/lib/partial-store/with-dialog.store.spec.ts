import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { withDialog } from './with-dialog.store';

describe('withDialog', () => {
  const TestStore = signalStore({ providedIn: 'root' }, withState({ name: 'test' }), withDialog());

  function setup() {
    return TestBed.inject(TestStore);
  }

  it('should initialize with dialog closed', () => {
    const store = setup();
    expect(store.dialogOpen()).toBe(false);
    expect(store.dialogTitle()).toBe('');
    expect(store.dialogMessage()).toBe('');
    expect(store.dialogData()).toBeNull();
  });

  it('should open dialog with title and message', () => {
    const store = setup();
    store.openDialog('Delete File', 'Are you sure?');
    expect(store.dialogOpen()).toBe(true);
    expect(store.dialogTitle()).toBe('Delete File');
    expect(store.dialogMessage()).toBe('Are you sure?');
    expect(store.dialogData()).toBeNull();
  });

  it('should open dialog with data', () => {
    const store = setup();
    const data = { filePath: '/src/main.ts' };
    store.openDialog('Confirm', 'Delete this file?', data);
    expect(store.dialogData()).toEqual(data);
  });

  it('should close dialog and reset all fields', () => {
    const store = setup();
    store.openDialog('Title', 'Message', { id: 1 });
    store.closeDialog();
    expect(store.dialogOpen()).toBe(false);
    expect(store.dialogTitle()).toBe('');
    expect(store.dialogMessage()).toBe('');
    expect(store.dialogData()).toBeNull();
  });
});
