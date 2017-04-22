import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {MaterialModule} from '@angular/material';

import {EditObservableService} from './edit.service';
import {EditDialogComponent} from './editDialog.component';

@NgModule({
  declarations: [EditDialogComponent],
  entryComponents: [EditDialogComponent],
  exports: [EditDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MaterialModule
  ],
  providers: [EditObservableService]
})
export class EditModule {}
