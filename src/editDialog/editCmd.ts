/* tslint:disable:max-classes-per-file */
export enum CmdOptions {
  CreateItem,
  UpdateItem,
  RemoveItem
}

export interface ICmd {
  cmdType: CmdOptions;
  row: number;
  column: number;
}

export interface IValueCmd extends ICmd {
  value: number;
}

export class CreateItemCmd implements IValueCmd {
  cmdType = CmdOptions.CreateItem;
  constructor(public row: number, public column: number, public value: number) {}
}

export class UpdateItemCmd implements IValueCmd {
  cmdType = CmdOptions.UpdateItem;
  constructor(public row: number, public column: number, public value: number) {}
}

export class RemoveItemCmd implements ICmd {
  cmdType = CmdOptions.RemoveItem;
  constructor(public row: number, public column: number) {}
}
