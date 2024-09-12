import type { Accessor } from 'solid-js';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import { createComputedExpression } from './createComputedExpression.ts';

export const createNoteReadonlyThunk = (
	context: EvaluationContext,
	readonlyDefinition: BindComputationExpression<'readonly'>
): Accessor<true> => {
	if (!readonlyDefinition.isConstantTruthyExpression()) {
		throw new Error('Expected a static readonly expression');
	}

	let result = true;

	if (import.meta.env.DEV) {
		const { expression } = readonlyDefinition;

		if (readonlyDefinition.dependencyReferences.size > 0) {
			throw new Error(`Expected expression ${expression} to have no dependencies`);
		}

		const computedExpression = createComputedExpression(context, readonlyDefinition);

		result = computedExpression();

		if (result !== true) {
			throw new Error(`Expected expression ${readonlyDefinition.expression} to return true`);
		}
	}

	return () => result;
};
