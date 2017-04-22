import {AbstractControl, ValidatorFn} from '@angular/forms';

export class CustomValidators {
  static minValueValidator(min: number): ValidatorFn {
    return (c: AbstractControl) => c.value >= min ? null : {minValue: c.value};
  }

  static maxValueValidator(max: number): ValidatorFn {
    return (c: AbstractControl) => c.value <= max ? null : {maxValue: c.value};
  }

  static isNumberValidator(): ValidatorFn {
    return (c: AbstractControl) => !Number.isNaN(c.value) ? null : {number: c.value};
  }

  static isIntegerValidator(): ValidatorFn {
    return (c: AbstractControl) => Number.isInteger(c.value) ? null : {number: c.value};
  }
}
