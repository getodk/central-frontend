import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { mathAlias } from '../_shared/number.ts';

export const ceiling = mathAlias('ceil');
export const floor = mathAlias('floor');

export const number = new NumberFunction(
  [{ arityType: 'optional' }],
  (
    context,
    [expression]
  ): number => (expression?.evaluate(context) ?? context).toNumber()
);

export const round = mathAlias('round');

export const sum = new NumberFunction(
  [{ arityType: 'required' }],
  (context, expressions): number => {
    if (expressions.length === 0) {
      return NaN;
    }

    let result!: number;

    for (const expression of expressions) {
      const resultSet = expression.evaluate(context);

      for (const item of resultSet) {
        const number = item.toNumber();

        if (Number.isNaN(number)) {
          result = NaN;

          break;
        }

        result = (result == null ? number : (result + number));

        if (Number.isNaN(result)) {
          break;
        }
      }
    }

    return result ?? NaN;
  }
);
