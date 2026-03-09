import { Component, computed, inject, input, OnInit } from '@angular/core';
import { CollapsibleSectionStore } from './collapsible-section.store';

@Component({
  selector: 'ui-collapsible-section',
  standalone: true,
  templateUrl: './collapsible-section.component.html',
  styleUrls: ['./collapsible-section.component.scss'],
})
export class CollapsibleSectionComponent implements OnInit {
  readonly id = input.required<string>();
  readonly title = input.required<string>();

  private readonly store = inject(CollapsibleSectionStore);
  readonly collapsed = computed(() => this.store.isCollapsed(this.id()));

  ngOnInit(): void {
    this.store.loadFromStorage();
    this.store.register(this.id());
  }

  toggle(): void {
    this.store.toggle(this.id());
  }
}
