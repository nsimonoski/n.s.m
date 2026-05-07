import { Component, computed, contentChild, inject, input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CollapsibleSectionStore } from './collapsible-section.store';

@Component({
  selector: 'ui-collapsible-section',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './collapsible-section.component.html',
  styleUrls: ['./collapsible-section.component.scss'],
})
export class CollapsibleSectionComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  readonly title = input.required<string>();
  readonly expanded = input(false);
  readonly contentTemplate = contentChild(TemplateRef);

  private readonly store = inject(CollapsibleSectionStore);
  readonly collapsed = computed(() => this.store.isCollapsed(this.id()));

  ngOnInit(): void {
    this.store.loadFromStorage();
    this.store.register(this.id(), this.expanded());
  }

  ngOnDestroy(): void {
    this.store.unregister(this.id());
  }

  toggle(): void {
    this.store.toggle(this.id());
  }
}
