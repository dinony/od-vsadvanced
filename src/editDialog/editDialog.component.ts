import {
  AfterViewInit, Component, ElementRef,
  OnDestroy, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormGroup,
  ValidatorFn, Validators
} from '@angular/forms';

import {MdDialogRef} from '@angular/material';

import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

import 'rxjs/add/operator/take';

import {IVirtualScrollWindow} from 'od-virtualscroll';

import {CustomValidators} from '../formUtils/validators';

import {EditObservableService} from './edit.service';
import {
  CmdOptions, CreateItemCmd,
  RemoveItemCmd, UpdateItemCmd
} from './editCmd';

@Component({
  selector: 'od-virtualscroll-editDialog',
  styleUrls: ['src/editDialog/editDialog.component.css'],
  template: `
    <md-dialog-content>
      <form [formGroup]="editForm" novalidate>
        <div>
        <md-input-container class="form-control" [dividerColor]="isFieldInvalid('row') ? 'warn' : 'primary'">
          <input type="number" mdInput placeholder="Row" formControlName="row">
          <md-hint class="form-error" *ngIf="isFieldInvalid('row')" align="end">Invalid</md-hint>
        </md-input-container>
        <md-input-container class="form-control" [dividerColor]="isFieldInvalid('column') ? 'warn' : 'primary'">
          <input type="number" mdInput placeholder="Column" formControlName="column">
          <md-hint class="form-error" *ngIf="isFieldInvalid('column')" align="end">Invalid</md-hint>
        </md-input-container>
        <md-select placeholder="Operation" formControlName="cmdType">
          <md-option *ngFor="let option of cmdOptions" [value]="option.value">
            {{option.viewValue}}
          </md-option>
        </md-select>
        </div>
        <div [hidden]="!valueRequired">
          <md-input-container class="form-control" [dividerColor]="isFieldInvalid('val') ? 'warn' : 'primary'">
            <input type="number" mdInput placeholder="Value" formControlName="val">
            <md-hint class="form-error" *ngIf="isFieldInvalid('val')" align="end">Invalid</md-hint>
          </md-input-container>
        </div>
      </form>
    </md-dialog-content>
    <md-dialog-actions align="end">
      <button class="update-btn" type="button" md-raised-button #updateBtn>Update</button>
      <button type="button" md-button md-dialog-close>Close</button>
    </md-dialog-actions>
  `
})
export class EditDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('updateBtn', {read: ElementRef}) updateBtn: ElementRef;

  editForm: FormGroup;
  cmdOptions = [
    {value: CmdOptions.CreateItem, viewValue: 'Create'},
    {value: CmdOptions.UpdateItem, viewValue: 'Update'},
    {value: CmdOptions.RemoveItem, viewValue: 'Remove'},
  ];

  private _OptionsEnum = CmdOptions;

  private _subs: Subscription[] = [];

  constructor(
    private _formBuilder: FormBuilder, private _dialogRef: MdDialogRef<EditDialogComponent>,
    private _obsService: EditObservableService) {
    this._createForm();
  }

  private _createForm() {
    const dialogConfigData = this._dialogRef._containerInstance.dialogConfig.data;
    const scrollWin$ = dialogConfigData.scrollWin$;

    this._subs.push(scrollWin$.take(1).subscribe(([scrollWin]: [IVirtualScrollWindow]) => {
      this.editForm = this._formBuilder.group({
        cmdType: [CmdOptions.CreateItem, [Validators.required]],
        column: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(0), CustomValidators.maxValueValidator(scrollWin.numActualColumns - 1)]],
        row: [0, [Validators.required, CustomValidators.isNumberValidator(), CustomValidators.isIntegerValidator(), CustomValidators.minValueValidator(0), CustomValidators.maxValueValidator(scrollWin.numVirtualRows - 1)]],
        val: [0, [Validators.required]]
      });
    }));
  }

  valueRequired = true;

  isFieldInvalid = (path: string) => this.editForm.get(path).status === 'INVALID';

  ngAfterViewInit() {
    const updateClick$ = Observable.fromEvent(this.updateBtn.nativeElement, 'click');
    const editChanges$ = this.editForm.valueChanges;

    this._subs.push(updateClick$.withLatestFrom(editChanges$).subscribe(([click, edit]) => {
      if(this.editForm.status === 'VALID') {
        switch(edit.cmdType) {
          case CmdOptions.CreateItem:
            this._obsService.emitEditCmd(new CreateItemCmd(edit.row, edit.column, edit.val));
            break;
          case CmdOptions.UpdateItem:
            this._obsService.emitEditCmd(new UpdateItemCmd(edit.row, edit.column, edit.val));
            break;
          case CmdOptions.RemoveItem:
            this._obsService.emitEditCmd(new RemoveItemCmd(edit.row, edit.column));
            break;
        }
      }
    }));

    this._subs.push(this.editForm.get('cmdType').valueChanges.subscribe(cmdType => {
      const required = cmdType !== CmdOptions.RemoveItem;
      this.valueRequired = required;

      const valCtrl = this.editForm.get('val');
      valCtrl.setValidators(required ? Validators.required : Validators.nullValidator);
      valCtrl.updateValueAndValidity();
    }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }
}
