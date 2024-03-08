import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';

export const toStrings = (
	context: EvaluationContext,
	expressions: readonly EvaluableArgument[]
): readonly string[] => {
	return expressions.flatMap((arg) => {
		const result = arg.evaluate(context);

		switch (result.type) {
			case 'NODE':
				return [...result].map((value) => value.toString());
		}

		return result.toString();
	});
};
