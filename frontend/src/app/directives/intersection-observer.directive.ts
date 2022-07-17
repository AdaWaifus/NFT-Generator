import {AfterViewInit, Directive, ElementRef, EventEmitter, OnDestroy, Output} from '@angular/core';

@Directive({selector: '[intersection-observer]'})
export class IntersectionObserverDirective implements AfterViewInit, OnDestroy {
  @Output() visible = new EventEmitter<boolean>();
  private intersectionObserver!: IntersectionObserver;

  constructor(private _elemRef: ElementRef) {}

  intersectionCallback = (entries: any[]) => {
    entries.forEach(entry => {
      const visiblePct = Math.floor(entry.intersectionRatio * 100);
      if (visiblePct > 0) {
        this.visible.emit(true);
      } else {
        this.visible.emit(false);
      }
    });
  };

  ngAfterViewInit(): void {
    // Options for the observers
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: [0.0, 0.1],
    };
    this.intersectionObserver = new IntersectionObserver(this.intersectionCallback, observerOptions);
    this.intersectionObserver.observe(this._elemRef.nativeElement);
  }

  ngOnDestroy() {
    this.intersectionObserver.unobserve(this._elemRef.nativeElement);
    this.intersectionObserver.disconnect();
  }
}
