import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';

export const evaluateInt = (context: EvaluationContext, expression: EvaluableArgument) =>
	parseInt(expression.evaluate(context).toString(), 10);

type MathAliasMethodName =
	| 'abs'
	| 'acos'
	| 'asin'
	| 'atan'
	| 'ceil'
	| 'cos'
	| 'exp'
	| 'floor'
	| 'log'
	| 'log10'
	| 'round'
	| 'sin'
	| 'sqrt'
	| 'tan';

export const mathAlias = (method: MathAliasMethodName) =>
	new NumberFunction(method, [{ arityType: 'required' }], (context, [expression]): number => {
		const number = (expression?.evaluate(context) ?? context).toNumber();

		if (Number.isNaN(number)) {
			return number;
		}

		return Math[method](number);
	});

type Math2AliasMethodName = 'atan2' | 'pow';

export const math2Alias = (method: Math2AliasMethodName) =>
	new NumberFunction(
		method,
		[{ arityType: 'required' }, { arityType: 'required' }],
		(context, [expression0, expression1]): number => {
			const number0 = expression0!.evaluate(context).toNumber();

			if (Number.isNaN(number0)) {
				return number0;
			}

			const number1 = expression1!.evaluate(context).toNumber();

			if (Number.isNaN(number1)) {
				return number1;
			}

			return Math[method](number0, number1);
		}
	);

type MathNAliasMethodName = 'max' | 'min';

interface ToNumberArgumentsOptions {
	readonly shortCircuitOnNaN: boolean;
}

const toNumberArguments = (
	context: EvaluationContext,
	expressions: readonly EvaluableArgument[],
	options: ToNumberArgumentsOptions
): number[] => {
	const numbers: number[] = [];

	for (const expression of expressions) {
		const results = expression.evaluate(context);

		for (const result of results) {
			const number = result.toNumber();

			numbers.push(number);

			if (Number.isNaN(number) && options.shortCircuitOnNaN) {
				return numbers;
			}
		}
	}

	return numbers;
};

export const mathNAlias = (method: MathNAliasMethodName) =>
	new NumberFunction(
		method,
		[
			// Deviates from ODK XForms spec, matches ORXE
			{ arityType: 'variadic' },
		],
		(context, expressions): number => {
			const args = toNumberArguments(context, expressions, {
				shortCircuitOnNaN: true,
			});

			if (args.length === 0) {
				return NaN;
			}

			return Math[method](...args);
		}
	);
