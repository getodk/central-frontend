import { FunctionAlias } from '../../evaluator/functions/FunctionAlias.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { mathAlias } from '../_shared/number.ts';

const ceil = mathAlias('ceil');

export const ceiling = new FunctionAlias('ceiling', ceil);

export const floor = mathAlias('floor');

export const number = new NumberFunction(
  'number',
  [{ arityType: 'optional' }],
  (context, [expression]): number => (expression?.evaluate(context) ?? context).toNumber()
);

export const round = mathAlias('round');

export const sum = new NumberFunction(
  'sum',
  [{ arityType: 'required' }],
  (context, [expression]): number => {
    let result = 0;

    const resultSet = expression!.evaluate(context);

    for (const item of resultSet) {
      const numberValue = item.toNumber();

      if (Number.isNaN(numberValue)) {
        return NaN;
      }

      result += numberValue;

      if (Number.isNaN(result)) {
        return NaN;
      }
    }

    return result;
  }
);
