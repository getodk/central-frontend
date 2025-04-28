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

		for (let i = 0; i < expressions.length; i += 2) {
			const expression = expressions[i]!;
			const weightExpression = expressions[i + 1];

			if (weightExpression == null) {
				throw 'todo';
			}

			const results = expression.evaluate(context).values();
			const weights = weightExpression.evaluate(context).values();

			const length = Math.max(results.length, weights.length);

			for (let j = 0; j < length; j += 1) {
				const weight = weights[j];

				if (weight == null) {
					break;
				}

				const result = results[j];

				if (result == null) {
					return false;
				}

				if (result.toBoolean()) {
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
