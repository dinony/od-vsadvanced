import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Input, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormGroup,
  ValidatorFn, Validators
} from '@angular/forms';

import {MdDialogRef} from '@angular/material';

import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import 'rxjs/add/observable/fromEvent';

import {CmdOption} from 'od-virtualscroll';
import {CmdOptionNames} from 'od-vsdebug';

import {CustomValidators} from '../formUtils/validators';
import {ISettings} from './settings';
import {SettingsObservableService} from './settings.service';

@Component({
  selector: 'od-virtualscroll-settingsDialog',
  styles: [`
    .form-control {
      margin-right: 10px;
      width: 120px;
    }

    span[md-suffix] {
      font-size: 9px;
    }

    .update-btn {
      margin-right: 4px;
    }

    .form-error {
      color: red;
    }

    .checkbox-group {
      display: flex;
      justify-content: space-between;
    }
  `],
  template: `
    <md-dialog-content>
      <form [formGroup]="vsForm" novalidate>
        <section formGroupName="basic">
          <h4>Basic Settings</h4>
          <md-input-container [dividerColor]="isFieldInvalid('basic.numItems') ? 'warn' : 'primary'" class="form-control">
            <input type="number" mdInput placeholder="Number of items" formControlName="numItems">
            <md-hint class="form-error" *ngIf="isFieldInvalid('basic.numItems')" align="end">Invalid</md-hint>
          </md-input-container>
          <md-input-container mdTooltip="Number of additional rows rendered outside the viewport to improve the scrolling experience (typically: 1..2)" [dividerColor]="isFieldInvalid('basic.numAdditionalRows') ? 'warn' : 'primary'" class="form-control">
            <input type="number" mdInput placeholder="Number of additional rows" formControlName="numAdditionalRows">
            <md-hint class="form-error" *ngIf="isFieldInvalid('basic.numAdditionalRows')" align="end">Invalid</md-hint>
          </md-input-container><br>
          <md-input-container [dividerColor]="isFieldInvalid('basic.numLimitColumns') ? 'warn' : 'primary'" class="form-control">
            <input type="number" mdInput placeholder="Max. columns" formControlName="numLimitColumns">
            <md-hint class="form-error" *ngIf="isFieldInvalid('basic.numLimitColumns')" align="end">Invalid</md-hint>
          </md-input-container>
        </section>
        <section formGroupName="consoleWriter">
          <h4 mdTooltip="Log crucial component events in the console">Attach console writer</h4>
          <div><md-checkbox formControlName="attachScrollWin">Scroll window</md-checkbox></div>
          <div class="checkbox-group">
            <md-checkbox formControlName="attachCreateRow">{{cmdLabel(cmdOption.CreateRow)}}</md-checkbox>
            <md-checkbox formControlName="attachShiftRow">{{cmdLabel(cmdOption.ShiftRow)}}</md-checkbox>
            <md-checkbox formControlName="attachRemoveRow">{{cmdLabel(cmdOption.RemoveRow)}}</md-checkbox>
          </div>
          <div class="checkbox-group">
            <md-checkbox formControlName="attachCreateItem">{{cmdLabel(cmdOption.CreateItem)}}</md-checkbox>
            <md-checkbox formControlName="attachUpdateItem">{{cmdLabel(cmdOption.UpdateItem)}}</md-checkbox>
            <md-checkbox formControlName="attachRemoveItem">{{cmdLabel(cmdOption.RemoveItem)}}</md-checkbox>
          </div>
        </section>
        <section formGroupName="visualDebug">
          <h4>Attach visual debug tool</h4>
          <div class="checkbox-group">
            <md-checkbox formControlName="show">Show visual debug</md-checkbox>
          </div>
        </section>
      </form>
    </md-dialog-content>
    <md-dialog-actions align="end">
      <button class="update-btn" type="button" md-raised-button #updateBtn>Update</button>
      <button type="button" md-button md-dialog-close>Close</button>
    </md-dialog-actions>
  `
})
export class SettingsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('updateBtn', {read: ElementRef}) updateBtn: ElementRef;
  @Input() formData: Observable<ISettings>;
  @Output() onClose = new EventEmitter();

  vsForm: FormGroup;
  private _subs: Subscription[] = [];

  cmdOption = CmdOption;

  constructor(private _formBuilder: FormBuilder, private _dialogRef: MdDialogRef<SettingsDialogComponent>, private _obsService: SettingsObservableService) {
    this._createForm();
  }

  private _createForm() {
    this.vsForm = this._formBuilder.group({
      basic: this._formBuilder.group({
        numAdditionalRows: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(0)]],
        numItems: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(0)]],
        numLimitColumns: [0, [CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(0)]]
      }),
      consoleWriter: this._formBuilder.group({
        attachCreateItem: false,
        attachCreateRow: false,
        attachRemoveItem: false,
        attachRemoveRow: false,
        attachScrollWin: false,
        attachShiftRow: false,
        attachUpdateItem: false
      }),
      item: this._formBuilder.group({
        itemHeight: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(10)]],
        itemWidth: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(10)]]
      }),
      visualDebug: this._formBuilder.group({
        show: false
      })
    });
  }

  isFieldInvalid = (path: string) => this.vsForm.get(path).status === 'INVALID';

  private _closeClick = () => this.onClose.next();

  cmdLabel = (cmdType: CmdOption) => CmdOptionNames[cmdType];

  ngOnInit() {
    const dialogConfigData = this._dialogRef._containerInstance.dialogConfig.data;
    this._subs.push(dialogConfigData.settings$.subscribe((settings: ISettings) => {
      this.vsForm.reset(settings);
    }));
  }

  ngAfterViewInit() {
    const updateClick$ = Observable.fromEvent(this.updateBtn.nativeElement, 'click');
    const settingsChanges$ = this.vsForm.valueChanges;

    this._subs.push(updateClick$.withLatestFrom(settingsChanges$).subscribe(([click, settings]) => {
      if(this.vsForm.status === 'VALID') {
        settings.initData = this.vsForm.controls.basic.dirty;
        this._obsService.emitSettings(settings);
      }
    }));
  }

  ngOnDestroy = () => this._subs.forEach(sub => sub.unsubscribe());
}
