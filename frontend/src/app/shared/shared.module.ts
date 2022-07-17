import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatModule} from './mat.module';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {ImageFrameComponent} from '../components/image-frame/image-frame.component';
import {IntersectionObserverDirective} from '../directives/intersection-observer.directive';

const modules = [FormsModule, MatModule, RouterModule];

const components = [ImageFrameComponent];

const pipes = [IntersectionObserverDirective];

@NgModule({
  declarations: [components, pipes],
  imports: [CommonModule, modules],
  exports: [modules, components, pipes],
})
export class SharedModule {}
