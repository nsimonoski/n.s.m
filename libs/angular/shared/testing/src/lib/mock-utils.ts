import { EMPTY } from 'rxjs';

export function mockRouter(initialUrl = '/') {
  return {
    url: initialUrl,
    events: EMPTY,
    navigateByUrl: vi.fn(),
    createUrlTree: vi.fn().mockReturnValue({}),
    serializeUrl: vi.fn().mockReturnValue('/serialized'),
  };
}

export function mockActivatedRoute(overrides?: {
  params?: Record<string, string>;
  queryParams?: Record<string, string>;
  data?: Record<string, unknown>;
}) {
  return {
    snapshot: {
      params: overrides?.params ?? {},
      queryParams: overrides?.queryParams ?? {},
      data: overrides?.data ?? {},
    },
  };
}

export function mockWebSocketStore() {
  return {
    on: vi.fn().mockReturnValue(EMPTY),
    watch: vi.fn().mockReturnValue(EMPTY),
    connect: vi.fn(),
    disconnect: vi.fn(),
    reconnect: vi.fn(),
  };
}

export function mockSocketService() {
  return {
    on: vi.fn().mockReturnValue(EMPTY),
    watch: vi.fn(),
    emit: vi.fn(),
    reconnect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    onConnect: vi.fn().mockReturnValue(() => {}),
  };
}
