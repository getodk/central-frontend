import { zipLongest } from 'itertools-ts/lib/multi';
import { chunkwise } from 'itertools-ts/lib/single';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';

export const booleanFromString = new BooleanFunction(
	'boolean-from-string',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [expression]): boolean => {
		const value = expression!.evaluate(context).toString();

		return value === '1' || value === 'true';
	}
);

export const checklist = new BooleanFunction(
	'checklist',
	[
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'variadic' },
	],
	(context, [minExpression, maxExpression, ...expressions]): boolean => {
		const min = minExpression!.evaluate(context).toNumber();

		let max = maxExpression!.evaluate(context).toNumber();

		if (max === -1) {
			if (min < 1) {
				return true;
			}

			max = Infinity;
		}

		let satisfied = 0;

		for (const expression of expressions) {
			const results = expression.evaluate(context).values();

			for (const result of results) {
				if (result.toBoolean()) {
					satisfied += 1;

					if (satisfied > max) {
						return false;
					}
				}
			}
		}

		return satisfied >= min;
	}
);

export const weightedChecklist = new BooleanFunction(
	'weighted-checklist',
	[
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'variadic' },
	],
	(context, [minExpression, maxExpression, ...expressions]): boolean => {
		const min = minExpression!.evaluate(context).toNumber();

		let max = maxExpression!.evaluate(context).toNumber();

		if (max === -1) {
			if (min < 1) {
				return true;
			}

			max = Infinity;
		}

		let satisfied = 0;

		for (const [expression, weightExpression] of chunkwise(expressions, 2)) {
			const results = expression!.evaluate(context).values();
			const weights = weightExpression!.evaluate(context).values();

			for (const [result, weight] of zipLongest(results, weights)) {
				if (weight == null) {
					break;
				}

				if (result?.toBoolean() ?? false) {
					satisfied += weight.toNumber();

					if (satisfied > max) {
						return false;
					}
				}
			}
		}

		return satisfied >= min;
	}
);

export const xfIf = new FunctionImplementation(
	'if',
	[
		{ arityType: 'required', typeHint: 'boolean' },
		{ arityType: 'required' },
		{ arityType: 'required' },
	],
	(context, [conditionExpression, whenTrueExpression, whenFalseExpression]) => {
		const condition = conditionExpression!.evaluate(context).toBoolean();
		const expression = condition ? whenTrueExpression! : whenFalseExpression!;

		return expression.evaluate(context);
	}
);
