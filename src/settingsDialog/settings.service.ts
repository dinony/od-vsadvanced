import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {ISettings} from './settings';

@Injectable()
export class SettingsObservableService {
  private _settings = new Subject<ISettings>();

  settings$: Observable<ISettings> = this._settings.asObservable();
  emitSettings = (e: ISettings) => this._settings.next(e);
}
