import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { mockSnackbarService } from '@org/angular-testing';
import { withSnackbar } from './with-snackbar.store';
import { SnackbarService } from './snackbar.service';

describe('withSnackbar', () => {
  const TestStore = signalStore(
    { providedIn: 'root' },
    withState({ name: 'test' }),
    withSnackbar(),
  );

  function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: SnackbarService, useValue: mockSnackbarService() }],
    });
    return TestBed.inject(TestStore);
  }

  it('should show success snackbar', () => {
    const store = setup();
    store.showSuccess('Saved!');
    const service = TestBed.inject(SnackbarService);
    expect(service.success).toHaveBeenCalledWith('Saved!', undefined);
  });

  it('should show success with custom duration', () => {
    const store = setup();
    store.showSuccess('Done', 5000);
    const service = TestBed.inject(SnackbarService);
    expect(service.success).toHaveBeenCalledWith('Done', 5000);
  });

  it('should show error snackbar', () => {
    const store = setup();
    store.showError('Failed!');
    const service = TestBed.inject(SnackbarService);
    expect(service.error).toHaveBeenCalledWith('Failed!', undefined);
  });

  it('should show info snackbar', () => {
    const store = setup();
    store.showInfo('Note');
    const service = TestBed.inject(SnackbarService);
    expect(service.info).toHaveBeenCalledWith('Note', undefined);
  });

  it('should dismiss snackbar', () => {
    const store = setup();
    store.dismissSnackbar();
    const service = TestBed.inject(SnackbarService);
    expect(service.dismiss).toHaveBeenCalled();
  });
});
