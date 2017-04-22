import {Component, OnDestroy, OnInit} from '@angular/core';

import {MdDialog, MdDialogConfig} from '@angular/material';

import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {ConnectableObservable} from 'rxjs/observable/ConnectableObservable';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import 'rxjs/add/observable/range';

import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/reduce';

import {IVirtualScrollOptions, IVirtualScrollWindow, ScrollObservableService} from 'od-virtualscroll';
import {ConsoleWriterService, LogSource} from 'od-vsdebug';

import {EditObservableService} from './editDialog/edit.service';
import {CmdOptions, CreateItemCmd, ICmd, RemoveItemCmd, UpdateItemCmd} from './editDialog/editCmd';
import {EditDialogComponent} from './editDialog/editDialog.component';

import {ISettings} from './settingsDialog/settings';
import {SettingsObservableService} from './settingsDialog/settings.service';
import {SettingsDialogComponent} from './settingsDialog/settingsDialog.component';

@Component({
  selector: 'app-shell',
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .tiles-container {
      display: flex;
      justify-content: center;
    }

    .tile {
      align-items: center;
      border: 2px black solid;
      box-sizing: border-box;
      display: inline-flex;
      height: 200px;
      justify-content: center;
      margin-right: -2px;
      position: relative;
      width: 200px;
    }

    .tile-info {
      font-size: 10px;
      position: absolute;
      right: 5px;
      text-align: right;
      top: 5px;
    }

    .settings-btn {
      bottom: 90px;
      position: fixed;
      right: 30px;
    }

    .cmd-btn {
      bottom: 30px;
      position: fixed;
      right: 38px;
    }

    .header {
      align-items: center;
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 50px;
      width: 100%;
    }
  `],
  template: `
    <od-virtualscroll class="tiles-container" [vsData]="data$" [vsOptions]="options$" [vsEqualsFunc]="equals">
      <ng-template let-item let-row="row" let-column="column">
        <div class="tile">
          <div class="tile-info">
            <span>Row: {{row}}</span><br>
            <span>Column: {{column}}</span>
          </div>
          {{item}}
        </div>
      </ng-template>
    </od-virtualscroll>

    <div class="header" *ngIf="numItems === 0">
      <h1>od-virtualscroll</h1>
    </div>

    <od-virtualscroll-debug *ngIf="showDebug"></od-virtualscroll-debug>

    <button class="settings-btn" type="button" md-fab (click)="openSettings()">
      <md-icon>settings</md-icon>
    </button>

    <button class="cmd-btn" type="button" md-mini-fab (click)="openEdit()">
      <md-icon>mode_edit</md-icon>
    </button>`
})
export class AppComponent implements OnInit, OnDestroy {
  data$: ConnectableObservable<number[]>;
  options$: Observable<IVirtualScrollOptions>;
  private _settings$: BehaviorSubject<ISettings>;

  private _subs: Subscription[] = [];

  numItems: number;

  private _loggerNameMap = {
    attachCreateItem: LogSource.CreateItem,
    attachCreateRow: LogSource.CreateRow,
    attachRemoveItem: LogSource.RemoveItem,
    attachRemoveRow: LogSource.RemoveRow,
    attachScrollWin: LogSource.ScrollWindow,
    attachShiftRow: LogSource.ShiftRow,
    attachUpdateItem: LogSource.UpdateItem
  };

  showDebug = false;

  private _curData: number[];
  private _prevData: number[];

  equals = (prevDataIndex: number, curDataIndex: number) => {
    if(this._prevData !== undefined && this._curData !== undefined && this._prevData.length > prevDataIndex && this._curData.length > curDataIndex) {
      return this._prevData[prevDataIndex] === this._curData[curDataIndex];
    } else {
      return false;
    }
  }

  constructor(
    private _dialog: MdDialog, private _scrollObsService: ScrollObservableService,
    private _settingsService: SettingsObservableService, private _editService: EditObservableService,
    private _writer: ConsoleWriterService) {}

  openSettings() {
    const dialogConfig = new MdDialogConfig();
    // Pass observable
    dialogConfig.data = {
      settings$: this._settings$
    };

    this._dialog.open(SettingsDialogComponent, dialogConfig);
  }

  openEdit() {
    const dialogConfig = new MdDialogConfig();

    dialogConfig.data = {
      scrollWin$: this._scrollObsService.scrollWin$
    };

    this._dialog.open(EditDialogComponent, dialogConfig);
  }

  ngOnInit() {
    const initSettings: ISettings = {
      basic: {numItems: 100, numAdditionalRows: 1, numLimitColumns: 0},
      consoleWriter: {
        attachCreateItem: false,
        attachCreateRow: false,
        attachRemoveItem: false,
        attachRemoveRow: false,
        attachScrollWin: false,
        attachShiftRow: false,
        attachUpdateItem: false
      },
      initData: true,
      item: {itemWidth: 202, itemHeight: 202},
      visualDebug: {
        show: false
      }
    };

    this._settings$ = new BehaviorSubject(initSettings);

    const editData$: Subject<number[]> = new Subject();

    const initData$ = this._settings$
      .filter(({initData}) => initData === true)
      .pluck('basic', 'numItems')
      .concatMap((numItems: number) => {
        return Observable.range(0, numItems)
          .reduce((acc, cur) => {
            acc.push(cur);
            return acc;
          }, []);
      });

    this.data$ = Observable.merge(initData$, editData$).publishReplay(1);

    this.options$ = this._settings$.map(({basic: {numAdditionalRows, numLimitColumns}, item: {itemWidth, itemHeight}}) => {
      return {itemWidth, itemHeight, numAdditionalRows};
    });

    this._subs.push(this.data$.subscribe(data => {
      this.numItems = data.length;
    }));

    this._subs.push(this._settings$.subscribe(({visualDebug: {show}}) => {
      this.showDebug = show;
    }));

    this._subs.push(this._settingsService.settings$.subscribe(settings => {
      this._settings$.next(settings);
    }));

    const dSettings$ = this._settings$.pairwise();

    for(const key in this._loggerNameMap) {
      this._subLoggerHandling(dSettings$, key, this._loggerNameMap[key]);
    }

    const getIndex = (row: number, numColumns: number, column: number) => row * numColumns + column;

    const dataScrollWin$ = Observable.combineLatest(this.data$, this._scrollObsService.scrollWin$).map(([data, [scrollWin]]) => [data, scrollWin]);

    let settingsRef: ISettings;
    this._subs.push(this._settings$.subscribe(settings => {
      settingsRef = settings;
    }));

    const clonePrevData = (data: any[]) => {
      this._prevData = [];
      data.forEach((d: any) => this._prevData.push(d));
    };

    this._subs.push(
      this._editService.editCmd$.withLatestFrom(dataScrollWin$)
      .subscribe(([cmd, [data, scrollWin]]: [ICmd, [any[], IVirtualScrollWindow]]) => {
        const index = getIndex(cmd.row, scrollWin.numActualColumns, cmd.column);
        if(index >= 0 && index < data.length) {
          clonePrevData(data);

          switch(cmd.cmdType) {
            case CmdOptions.CreateItem:
              const create = cmd as CreateItemCmd;
              const left = data.slice(0, index);
              const right = data.slice(index);
              const nextData = left.concat([create.value]).concat(right);
              settingsRef.basic.numItems = nextData.length;
              settingsRef.initData = false;
              this._settings$.next(settingsRef);
              editData$.next(nextData);
              break;
            case CmdOptions.UpdateItem:
              const update = cmd as UpdateItemCmd;
              data[index] = update.value;
              editData$.next(data);
              break;
            case CmdOptions.RemoveItem:
              const remove = cmd as RemoveItemCmd;
              data.splice(index, 1);
              settingsRef.basic.numItems = data.length;
              settingsRef.initData = false;
              this._settings$.next(settingsRef);
              editData$.next(data);
              break;
          }
        }
    }));

    this._subs.push(this.data$.subscribe(data => {
      this._curData = data;
    }));

    this._subs.push(this.data$.connect());
  }

  private _subLoggerHandling(dSettings$: Observable<ISettings[]>, logSourceName: string, logSource: LogSource) {
    // off -> on
    this._subs.push(dSettings$
      .filter(([prev, cur]: ISettings[]) => !prev.consoleWriter[logSourceName] && cur.consoleWriter[logSourceName])
      .subscribe(([prevSetting, curSetting]: ISettings[]) => {
        this._writer.attach(logSource);
      }));

    // on -> off
    this._subs.push(dSettings$
      .filter(([prev, cur]: ISettings[]) => prev.consoleWriter[logSourceName] && !cur.consoleWriter[logSourceName])
      .subscribe(([prevSetting, curSetting]: ISettings[]) => {
        this._writer.detach(logSource);
      }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }
}
