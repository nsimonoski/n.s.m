/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FileTreeNodeComponent } from './file-tree-node.component';

describe('FileTreeNodeComponent', () => {
  let component: FileTreeNodeComponent;
  let fixture: ComponentFixture<FileTreeNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FileTreeNodeComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileTreeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
