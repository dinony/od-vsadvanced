import {Injectable} from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {ICmd} from './editCmd';

@Injectable()
export class EditObservableService {
  private _editCmd = new Subject<ICmd>();

  editCmd$: Observable<ICmd> = this._editCmd.asObservable();
  emitEditCmd = (e: ICmd) => this._editCmd.next(e);
}
