import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {MaterialModule} from '@angular/material';
import {VirtualScrollModule} from 'od-virtualscroll';
import {VirtualScrollDebugModule} from 'od-vsdebug';

import {AppComponent} from './app.component';

import {EditModule as VirtualScrollEditModule} from './editDialog/edit.module';
import {SettingsModule as VirtualScrollSettingsModule} from './settingsDialog/settings.module';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    MaterialModule,
    VirtualScrollModule,
    VirtualScrollDebugModule,

    VirtualScrollSettingsModule,
    VirtualScrollEditModule
  ]
})
export class AppModule {}
