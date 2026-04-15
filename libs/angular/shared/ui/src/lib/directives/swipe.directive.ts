import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

const SWIPE_THRESHOLD = 50;

@Directive({
  selector: '[uiSwipe]',
  standalone: true,
})
export class SwipeDirective {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  private startX = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const delta = endX - this.startX;

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) {
        this.swipeRight.emit();
      } else {
        this.swipeLeft.emit();
      }
    }
  }
}
