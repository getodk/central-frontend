import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import {
  mathAlias,
  math2Alias,
  mathNAlias,
} from '../_shared/number.ts';

export const abs = mathAlias('abs');
export const acos = mathAlias('acos');
export const asin = mathAlias('asin');
export const atan = mathAlias('atan');
export const atan2 = math2Alias('atan2');
export const cos = mathAlias('cos');
export const exp = mathAlias('exp');

export const exp10 = new NumberFunction(
  [
    { arityType: 'required', typeHint: 'number' },
  ],
  (context, [expression]): number => {
    const number = expression!.evaluate(context).toNumber();

    return 10 ** number;
  }
);

export const int = new NumberFunction(
  [
    { arityType: 'required', typeHint: 'number' },
  ],
  (context, [expression]): number => {
    const number = expression!.evaluate(context).toNumber();

    return number > 0 ? Math.floor(number) : Math.ceil(number);
  }
);

export const log = mathAlias('log');
export const log10 = mathAlias('log10');
export const max = mathNAlias('max');
export const min = mathNAlias('min');

const { PI } = Math;

export const pi = new NumberFunction(
  [],
  (): number => PI
);

export const pow = math2Alias('pow');

export const random = new NumberFunction(
  [],
  Math.random
);

export const round = new NumberFunction(
  [
    { arityType: 'required', typeHint: 'number' },
    { arityType: 'optional', typeHint: 'number' },
  ],
  (context, [valueExpression, decimalsExpression]) => {
    const value = valueExpression!.evaluate(context).toNumber();

    if (Number.isNaN(value)) {
      return value;
    }

    const decimals = decimalsExpression?.evaluate(context).toNumber() ?? 0;

    if (Number.isNaN(decimals)) {
      return NaN;
    }

    const sign = value < 0 ? -1 : 1;
    const unsigned = Math.abs(value);
    const decimalMultiplier = 10 ** decimals;
    const shifted = unsigned * decimalMultiplier;
    const rounded = Math.round(shifted);

    return rounded / decimalMultiplier * sign;
  }
)

export const sin = mathAlias('sin');
export const sqrt = mathAlias('sqrt');
export const tan = mathAlias('tan');
