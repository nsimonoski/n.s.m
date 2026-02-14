import { TestBed } from '@angular/core/testing';

describe('FileExplorer', () => {
  let service: FileExplorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileExplorer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
