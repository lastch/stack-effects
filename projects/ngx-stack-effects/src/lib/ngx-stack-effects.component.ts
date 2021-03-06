import { Component, OnInit, Input, ElementRef, Renderer2, AfterViewInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { StackEffects } from './stack-effects';
import { Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, takeUntil } from 'rxjs/operators';

interface EffectItem {
  index: number;
  element: HTMLElement;
  position: number;
}

@Component({
  selector: 'ngx-stack-effects',
  templateUrl: './ngx-stack-effects.component.html',
  styleUrls: ['./ngx-stack-effects.component.scss']
})
export class NgxStackEffectsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  effect = StackEffects.Fanout;

  @Input()
  width = `300px`;

  @Input()
  height = `200px`;

  @Output()
  animationEnd = new EventEmitter<number>();

  activeChanges = new Subject<boolean>();
  isActive = false;
  elements: EffectItem[] = [];
  selectedIndex = 0;

  private ngSubbscribe = new Subject();

  constructor(private elementRef: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.setStyle(this.elementRef.nativeElement, 'width', this.width);
    this.renderer.setStyle(this.elementRef.nativeElement, 'height', this.height);
    this.watchActivation();
  }

  ngOnDestroy() {
    this.elements.forEach((item) => item.element.remove());
    this.ngSubbscribe.next();
    this.ngSubbscribe.complete();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const items = this.elementRef.nativeElement.getElementsByClassName('nse-item');
      for (let i = 0; i < items.length; i++) {
        const element = items.item(i);
        this.elements.push({ element, index: i, position: i });
        (element as HTMLElement).addEventListener('mouseover', () => this.activeChanges.next(true));
        (element as HTMLElement).addEventListener('mouseleave', () => this.activeChanges.next(false));
        (element as HTMLElement).addEventListener('click', () => this.selectItem(i));
      }
      this.initialize();
    });
  }

  watchActivation() {
    this.activeChanges.pipe(
      takeUntil(this.ngSubbscribe),
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(status => {
      this.isActive = status;
      status ? this.active() : this.deactive();
    });
  }

  selectItem(index: number) {
    this.selectedIndex = index;
    this.active();
    this.animationEnd.emit(this.selectedIndex);
  }

  initialize() {
    switch (this.effect) {
      case StackEffects.Fanout:
      case StackEffects.SideGrid:
        this.elements.forEach((el, index) => {
          this.renderer.setStyle(el.element, 'z-index', this.selectedIndex === index ? 99 : 0);
        });
        break;

      case StackEffects.SimpleSpread:
      case StackEffects.RandomRotation:
      case StackEffects.Queue:
      case StackEffects.ElasticSpread:
      case StackEffects.VerticalSpread:
        this.elements.forEach((el, index) => {
          this.renderer.setStyle(el.element, 'z-index', 99 - index);
        });
        break;

      case StackEffects.SideSlide:
        this.handleCentralizedEffect(false);
        break;

      case StackEffects.PeekaBoo:
      case StackEffects.Fan:
        this.elements.forEach((el, index) => {
          this.setDeactiveStyle(el.element, index);
        });
        break;

      case StackEffects.PreviewGrid:
        const margin = 8;
        const width = (this.elementRef.nativeElement as HTMLElement).offsetWidth;
        const height = (this.elementRef.nativeElement as HTMLElement).offsetHeight;

        this.elements.forEach((el, i) => {
          let index = i - this.selectedIndex;
          if (index < 0) {
            index += this.elements.length;
          }
          // this.
        });
        break;

      case StackEffects.Leaflet:
      case StackEffects.Coverflow:
        this.renderer.setStyle(this.elementRef.nativeElement, 'perspective', '1600px');
        this.elements.forEach((el, index) => {
          this.renderer.setStyle(el.element, 'z-index', Math.abs(this.elements.length - index - 1));
          this.renderer.setStyle(el.element, 'transform-style', 'preserve-3d');
          this.renderer.setStyle(el.element, 'transform-origin', 'top center');
          if (this.effect === StackEffects.Leaflet) {
            this.renderer.setStyle(el.element, 'transform', 'rotateX(0deg)');
          }
          else {
            this.renderer.setStyle(el.element, 'transform', 'rotateY(0deg) scale(1)');
          }
        });
        break;
    }
  }

  deactive() {
    switch (this.effect) {
      case StackEffects.Fanout:
      case StackEffects.SimpleSpread:
      case StackEffects.RandomRotation:
      case StackEffects.SideGrid:
      case StackEffects.PeekaBoo:
      case StackEffects.Queue:
      case StackEffects.Fan:
      case StackEffects.ElasticSpread:
      case StackEffects.VerticalSpread:
      case StackEffects.Leaflet:
      case StackEffects.Coverflow:
        this.elements.forEach((el, index) => {
          this.setDeactiveStyle(el.element, index);
        });
        break;
      case StackEffects.SideSlide:
        this.handleCentralizedEffect(false);
        break;
    }
  }

  /**
   * When mouseover
   */
  active() {
    let center = Math.floor(this.elements.length / 2);
    switch (this.effect) {
      case StackEffects.Fanout:
        this.handleCentralizedEffect(true);
        break;

      case StackEffects.SimpleSpread:
        this.elements.forEach((el, i) => {
          let index;
          index = i - this.selectedIndex;
          if (index < 0) {
            index = this.elements.length + index;
          }
          if (index < center) {
            this.setActiveStyle(el.element, center - index, 'left');
          }
          else if (index > center) {
            this.setActiveStyle(el.element, index - center, 'right');
          }
          else {
            this.setActiveStyle(el.element, 0, 'center');
          }
          el.position = index;
        });
        break;

      case StackEffects.RandomRotation:
        this.elements.forEach((el, i) => {
          let index;
          index = i - this.selectedIndex;
          if (index < 0) {
            index = this.elements.length + index;
          }
          if (index === 0) {
            this.setActiveStyle(el.element, 0, 'center');
          }
          else {
            this.setActiveStyle(el.element, index, index % 2 === 1 ? 'left' : 'right');
          }
          el.position = index;
        });
        break;

      case StackEffects.SideSlide:
        this.handleCentralizedEffect(true);
        break;

      case StackEffects.SideGrid:
        const margin = 8;
        const width = (this.elementRef.nativeElement as HTMLElement).offsetWidth;
        const height = (this.elementRef.nativeElement as HTMLElement).offsetHeight;
        const p = {
          width: (width - margin) / 2,
          height: (height - margin) / 2,
          left: 0
        };
        const rows = Math.ceil(this.elements.length / 2);
        const total = rows * p.width + (rows - 1) * margin;
        const left = width / 2 - total / 2;
        this.elements.forEach((el, i) => {
          let index = i - this.selectedIndex;
          if (index < 0) {
            index += this.elements.length;
          }
          p.left = left + (p.width + margin) * (index < rows ? index : index - rows) - margin;
          if (index < rows) {
            this.setActiveStyle(el.element, -1, 'top', p);
          }
          else {
            this.setActiveStyle(el.element, -1, 'bottom', p);
          }
          el.position = index;
        });
        break;

      case StackEffects.PeekaBoo:
        center = Math.ceil(this.elements.length / 2);
        this.elements.forEach((el, i) => {
          let index = i - this.selectedIndex;
          if (index < 0) {
            index += this.elements.length;
          }
          if (index === 0) {
            this.setActiveStyle(el.element, 0, 'center');
          }
          else {
            this.setActiveStyle(el.element, Math.abs(center - index), index < center ? 'left' : 'right');
          }
          el.position = index;
        });
        break;

      case StackEffects.Queue:
        this.elements.forEach((el, i) => {
          let index;
          index = i - this.selectedIndex;
          if (index < 0) {
            index = this.elements.length + index;
          }
          this.setActiveStyle(el.element, index, 'center');
          el.position = index;
        });
        break;

      case StackEffects.Fan:
      case StackEffects.ElasticSpread:
      case StackEffects.VerticalSpread:
      case StackEffects.Leaflet:
      case StackEffects.Coverflow:
        this.elements.forEach((el, i) => {
          let index;
          index = i - this.selectedIndex;
          if (index < 0) {
            index = this.elements.length + index;
          }
          this.setActiveStyle(el.element, Math.abs(this.elements.length - index - 1), 'center');
          el.position = index;
        });
        break;
    }
  }


  /**
   * Set style on an item when it's activated
   */
  setActiveStyle(item: HTMLElement, index: number, d: 'left' | 'right' | 'center' | 'top' | 'bottom', p?) {
    this.renderer.setStyle(item, 'box-shadow', '0px 7px 17px 3px #0000006b');
    this.renderer.setStyle(item, 'opacity', 1);

    switch (this.effect) {

      case StackEffects.Fanout:
        const transform = 'scale(0.9)' + d !== 'center' ? ` rotate(${d === 'left' ? -index * 10 : index * 10}deg)` : '';
        this.renderer.setStyle(item, 'transform', transform);
        if (d === 'center') { return; }
        this.renderer.setStyle(item, 'left', `${d === 'left' ? -index * 100 : index * 100}px`);
        this.renderer.setStyle(item, 'top', `${index * 20}px`);
        this.renderer.setStyle(item, 'z-index', `${90 - index}`);
        break;

      case StackEffects.SimpleSpread:
        if (d === 'center') {
          this.renderer.setStyle(item, 'left', 0);
          this.renderer.setStyle(item, 'top', 0);
          this.renderer.setStyle(item, 'z-index', 50);
        } else {
          this.renderer.setStyle(item, 'left', `${d === 'left' ? -index * 25 : index * 25}px`);
          this.renderer.setStyle(item, 'top', `${d === 'left' ? index * 25 : index * -25}px`);
          this.renderer.setStyle(item, 'z-index', 50 + (d === 'left' ? index : -index));
        }
        break;

      case StackEffects.RandomRotation:
        if (d === 'center') {
          this.renderer.setStyle(item, 'left', `30px`);
          this.renderer.setStyle(item, 'top', `30px`);
          this.renderer.setStyle(item, 'z-index', 99);
          this.renderer.setStyle(item, 'transform', 'rotate(0deg)');
        } else {
          this.renderer.setStyle(item, 'transform', `rotate(${d === 'left' ? index * 5 : -index * 5}deg)`);
          this.renderer.setStyle(item, 'z-index', 99 - index);
          this.renderer.setStyle(item, 'left', 0);
          this.renderer.setStyle(item, 'top', 0);
        }
        break;

      case StackEffects.SideSlide:
        this.renderer.setStyle(item, 'opacity', 1);
        if (d === 'center') {
          this.renderer.setStyle(item, 'transform', 'scale(0.9)');
          this.renderer.setStyle(item, 'z-index', 99);
          this.renderer.setStyle(item, 'left', 0);
          return;
        }
        this.renderer.setStyle(item, 'transform', `scale(${1 - 0.15 * index})`);
        this.renderer.setStyle(item, 'left', `${d === 'left' ? -index * 50 : index * 50}px`);
        this.renderer.setStyle(item, 'z-index', `${90 - index}`);
        break;

      case StackEffects.SideGrid:
        this.renderer.setStyle(item, 'width', `${p.width}px`);
        this.renderer.setStyle(item, 'height', `${p.height}px`);
        this.renderer.setStyle(item, 'left', `${p.left}px`);
        this.renderer.setStyle(item, 'top', d === 'top' ? 0 : `${p.height + 4}px`);
        break;

      case StackEffects.PeekaBoo:
        if (d === 'center') {
          this.renderer.setStyle(item, 'transform', 'scale(0.9)');
          this.renderer.setStyle(item, 'left', 0);
          this.renderer.setStyle(item, 'z-index', 99);
          this.renderer.setStyle(item, 'top', 0);
          this.renderer.setStyle(item, 'transform-origin', 'bottom center');
        } else {
          this.renderer.setStyle(item, 'transform', `scale(0.5) rotate(${d === 'left' ? -index * 30 : index * 30}deg)`);
          this.renderer.setStyle(item, 'left', `${d === 'left' ? -index * 80 : index * 80}px`);
          this.renderer.setStyle(item, 'top', '-50px');
          this.renderer.setStyle(item, 'z-index', d === 'left' ? 90 + index : 90 - index);
          this.renderer.removeStyle(item, 'transform-origin');
        }
        break;

      case StackEffects.Queue:
        this.renderer.setStyle(item, 'z-index', 99 - index);
        this.renderer.setStyle(item, 'transform', `scale(${0.9 - 0.08 * index})`);
        this.renderer.setStyle(item, 'top', `${-index * 20}px`);
        break;

      case StackEffects.Fan:
        this.renderer.setStyle(item, 'z-index', index);
        this.renderer.setStyle(item, 'transform-origin', 'top left');
        this.renderer.setStyle(item, 'transform', `rotate(${index * 5}deg)`);
        this.renderer.setStyle(item, 'transition-delay', `.${this.elements.length - 1 - index}s`);
        break;

      case StackEffects.ElasticSpread:
        this.renderer.setStyle(item, 'z-index', index);
        this.renderer.setStyle(item, 'top', `${index * 35}px`);
        setTimeout(() => {
          this.renderer.setStyle(item, 'top', `${index * 30}px`);
          this.renderer.setStyle(item, 'transition', 'all .1s');
        }, 300);
        break;

      case StackEffects.VerticalSpread:
        this.renderer.setStyle(item, 'z-index', index);
        this.renderer.setStyle(item, 'transition-delay', `.${this.elements.length - 1 - index}s`);
        this.renderer.setStyle(item, 'top', `${index * 30}px`);
        break;

      case StackEffects.Leaflet:
        this.renderer.setStyle(item, 'z-index', index);
        this.renderer.setStyle(item, 'transform', `rotateX(${index ? 15 + index * 10 : 0}deg)`);
        this.renderer.setStyle(item, 'transition-delay', `.${this.elements.length - 1 - index}s`);
        break;

      case StackEffects.Coverflow:
        const center = Math.ceil(this.elements.length / 2);
        const margin = center - index;
        this.renderer.setStyle(item, 'z-index', index);
        this.renderer.setStyle(item, 'transform', 'rotateY(-45deg) scale(0.9)');
        this.renderer.setStyle(item, 'left', `${margin * 50}px`);
        break;
    }
  }

  /**
   * Set style on an item when it's deactivated
   */
  setDeactiveStyle(item: HTMLElement, index: number, d?: 'left' | 'right' | 'center') {
    this.renderer.removeStyle(item, 'box-shadow');

    switch (this.effect) {

      case StackEffects.Fanout:
        this.renderer.setStyle(item, 'top', 0);
        this.renderer.setStyle(item, 'left', 0);
        this.renderer.setStyle(item, 'transform', 'scale(1)');
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 0);
        this.renderer.setStyle(item, 'opacity', index === this.selectedIndex ? 1 : 0);
        break;

      case StackEffects.SimpleSpread:
      case StackEffects.RandomRotation:
        this.renderer.setStyle(item, 'top', 0);
        this.renderer.setStyle(item, 'left', 0);
        this.renderer.setStyle(item, 'transform', 'scale(1)');
        break;

      case StackEffects.SideSlide:
        if (d === 'center') {
          this.renderer.setStyle(item, 'transform', 'scale(1)');
          this.renderer.setStyle(item, 'opacity', 1);
          this.renderer.setStyle(item, 'z-index', 99);
          this.renderer.setStyle(item, 'left', 0);
        } else {
          this.renderer.setStyle(item, 'transform', `scale(${1 - index * 0.35})`);
          this.renderer.setStyle(item, 'left', `${d === 'left' ? -index * 100 : index * 100}px`);
          this.renderer.setStyle(item, 'opacity', 0);
        }
        break;

      case StackEffects.SideGrid:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 0);
        this.renderer.setStyle(item, 'width', '100%');
        this.renderer.setStyle(item, 'height', '100%');
        this.renderer.setStyle(item, 'left', 0);
        this.renderer.setStyle(item, 'top', 0);
        break;

      case StackEffects.PeekaBoo:
        if (this.selectedIndex === index) {
          this.renderer.setStyle(item, 'transform', 'scale(1)');
          this.renderer.setStyle(item, 'transform-origin', 'bottom center');
          this.renderer.setStyle(item, 'z-index', 99);
        } else {
          this.renderer.setStyle(item, 'transform', 'scale(0.1)');
          this.renderer.setStyle(item, 'top', 0);
          this.renderer.setStyle(item, 'z-index', 99 - index);
          this.renderer.removeStyle(item, 'transform-origin');
        }
        break;

      case StackEffects.Queue:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transform', 'scale(1)');
        this.renderer.setStyle(item, 'top', 0);
        break;

      case StackEffects.Fan:
        this.renderer.setStyle(item, 'transform-origin', 'top left');
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transform', 'rotate(0deg)');
        this.renderer.setStyle(item, 'transition', 'transform .3s');
        break;

      case StackEffects.ElasticSpread:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transition', 'all .3s');
        this.renderer.setStyle(item, 'top', 0);
        break;

      case StackEffects.VerticalSpread:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transition-delay', '0s');
        this.renderer.setStyle(item, 'top', 0);
        break;

      case StackEffects.Leaflet:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transform', `rotateX(0deg)`);
        this.renderer.setStyle(item, 'transition-delay', '0s');
        break;

      case StackEffects.Coverflow:
        this.renderer.setStyle(item, 'z-index', index === this.selectedIndex ? 99 : 99 - index);
        this.renderer.setStyle(item, 'transform', 'rotateY(0deg) scale(1)');
        this.renderer.setStyle(item, 'left', 0);
        break;
    }
  }

  handleCentralizedEffect(activate: boolean = false) {
    const center = Math.floor(this.elements.length / 2);
    for (let i = 1; i <= center; i++) {
      let pos = this.selectedIndex - i;
      if (pos < 0) { pos = this.elements.length + pos; }
      const item = this.elements[pos];
      item.position = center - i;
      if (activate) {
        this.setActiveStyle(item.element, i, 'left');
      }
      else {
        this.setDeactiveStyle(item.element, i, 'left');
      }
    }
    for (let i = 1; i < this.elements.length - center; i++) {
      let pos = this.selectedIndex + i;
      if (pos >= this.elements.length) { pos = pos - this.elements.length; }
      const item = this.elements[pos];
      item.position = center + i;
      if (activate) {
        this.setActiveStyle(item.element, i, 'right');
      }
      else {
        this.setDeactiveStyle(item.element, i, 'right');
      }
    }
    const selectedItem = this.elements[this.selectedIndex];
    selectedItem.position = center;
    this.setDeactiveStyle(selectedItem.element, this.selectedIndex, 'center');
    if (activate) {
      this.setActiveStyle(selectedItem.element, null, 'center');
    }
  }
}
