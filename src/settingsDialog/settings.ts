export interface ISettings {
  basic: {
    numItems: number;
    numAdditionalRows?: number;
    numLimitColumns?: number;
  };

  consoleWriter: {
    attachCreateItem: boolean;
    attachCreateRow: boolean;
    attachRemoveRow: boolean;
    attachRemoveItem: boolean;
    attachScrollWin: boolean;
    attachShiftRow: boolean;
    attachUpdateItem: boolean;
  };

  initData: boolean;

  item: {
    itemWidth: number;
    itemHeight: number;
  };

  visualDebug: {
    show: boolean;
  };
}
