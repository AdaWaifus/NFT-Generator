import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

const matModules = [
  MatDialogModule,
  MatExpansionModule,
  MatCheckboxModule,
  MatButtonModule,
  MatIconModule,
  MatProgressSpinnerModule,
];

@NgModule({
  imports: [matModules],
  exports: [matModules],
})
export class MatModule {}
