import {CommonModule} from '@angular/common';
import {NgModule, } from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {MaterialModule} from '@angular/material';

import {SettingsObservableService} from './settings.service';
import {SettingsDialogComponent} from './settingsDialog.component';

@NgModule({
  declarations: [SettingsDialogComponent],
  entryComponents: [SettingsDialogComponent],
  exports: [SettingsDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MaterialModule
  ],
  providers: [SettingsObservableService],

})
export class SettingsModule {}
