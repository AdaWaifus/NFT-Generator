import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-image-frame',
  templateUrl: './image-frame.component.html',
  styleUrls: ['./image-frame.component.scss'],
})
export class ImageFrameComponent {
  @Input() @HostBinding('class') contentClass = '';
  @Input() @HostBinding('id') contentID = '';
  @Input() @HostBinding('style.background-color') backgroundColor = 'var(--color-primary-500)';
}
