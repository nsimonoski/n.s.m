import { signalStore, withState } from '@ngrx/signals';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { withRouting } from './with-routing.store';

describe('withRouting', () => {
  const routerEvents$ = new Subject<NavigationEnd>();

  const mockRouter = {
    url: '/initial',
    events: routerEvents$.asObservable(),
    navigateByUrl: vi.fn(),
    createUrlTree: vi.fn().mockReturnValue({}),
    serializeUrl: vi.fn().mockReturnValue('/serialized'),
  };

  const mockActivatedRoute = {
    snapshot: {
      params: { id: '123' },
      queryParams: { tab: 'files' },
      data: { title: 'Test' },
    },
  };

  const TestStore = signalStore(
    { providedIn: 'root' },
    withState({ name: 'test' }),
    withRouting(),
  );

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });
    return TestBed.inject(TestStore);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose current URL signal with initial value', () => {
    const store = setup();
    expect(store.currentUrl()).toBe('/initial');
  });

  it('should expose query params signal with initial value', () => {
    const store = setup();
    expect(store.queryParams()).toEqual({ tab: 'files' });
  });

  it('should navigate to a route', () => {
    const store = setup();
    store.navigate('/editor');
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/editor');
  });

  it('should return route params', () => {
    const store = setup();
    expect(store.getRouteParams()).toEqual({ id: '123' });
  });

  it('should return query params', () => {
    const store = setup();
    expect(store.getQueryParams()).toEqual({ tab: 'files' });
  });

  it('should return route data', () => {
    const store = setup();
    expect(store.getRouteData()).toEqual({ title: 'Test' });
  });

  it('should open a new tab with serialized URL', () => {
    const store = setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    store.openInNewTab('/preview', { mode: 'dark' });
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/preview'], {
      queryParams: { mode: 'dark' },
    });
    expect(openSpy).toHaveBeenCalledWith('/serialized', '_blank');
    openSpy.mockRestore();
  });
});
