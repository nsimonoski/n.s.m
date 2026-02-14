import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularFileExplorer } from './angular-file-explorer';

describe('AngularFileExplorer', () => {
  let component: AngularFileExplorer;
  let fixture: ComponentFixture<AngularFileExplorer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularFileExplorer],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularFileExplorer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
