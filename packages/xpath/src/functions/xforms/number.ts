import { DateTimeLikeEvaluation } from '../../evaluations/DateTimeLikeEvaluation.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { NumberEvaluation } from '../../evaluations/NumberEvaluation.ts';
import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';
import { dateTimeFromString } from '../../lib/datetime/coercion.ts';
import { math2Alias, mathAlias, mathNAlias } from '../_shared/number.ts';

export const abs = mathAlias('abs');
export const acos = mathAlias('acos');
export const asin = mathAlias('asin');
export const atan = mathAlias('atan');
export const atan2 = math2Alias('atan2');
export const cos = mathAlias('cos');
export const exp = mathAlias('exp');

export const exp10 = new NumberFunction(
	'exp10',
	[{ arityType: 'required', typeHint: 'number' }],
	(context, [expression]): number => {
		const number = expression!.evaluate(context).toNumber();

		return 10 ** number;
	}
);

export const int = new NumberFunction(
	'int',
	[{ arityType: 'required', typeHint: 'number' }],
	(context, [expression]): number => {
		const number = expression!.evaluate(context).toNumber();

		return number > 0 ? Math.floor(number) : Math.ceil(number);
	}
);

export const log = mathAlias('log');
export const log10 = mathAlias('log10');
export const max = mathNAlias('max');
export const min = mathNAlias('min');

/**
 * Overrides the standard XPath 1.0 (fn namespaced) `number` in an
 * {@link XFormsXPathEvaluator}. This supports various date/datetime
 * cases where values would otherwise be treated as string literals
 * and fail to numerically compare as expected.
 */
// TODO: explicit override semantics?
export const number = new FunctionImplementation(
	'number',
	[{ arityType: 'optional' }],
	(context, [expression]): Evaluation<'NUMBER'> => {
		const results = expression?.evaluate(context) ?? context;
		const numberValue = results.toNumber();
		const { type } = results;

		if (type === 'NODE' || type === 'STRING') {
			const stringValue = results.toString();
			const dateTime = dateTimeFromString(context.timeZone, stringValue);

			if (dateTime != null) {
				return new DateTimeLikeEvaluation(context, dateTime, {
					booleanValue: true,
					stringValue,
				});
			}
		}

		if (type === 'NUMBER') {
			return results as Evaluation<'NUMBER'>;
		}

		return new NumberEvaluation(context, numberValue);
	}
);

const { PI } = Math;

export const pi = new NumberFunction('pi', [], (): number => PI);

export const pow = math2Alias('pow');

export const random = new NumberFunction('random', [], Math.random);

export const round = new NumberFunction(
	'round',
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

		return (rounded / decimalMultiplier) * sign;
	}
);

export const sin = mathAlias('sin');
export const sqrt = mathAlias('sqrt');
export const tan = mathAlias('tan');
