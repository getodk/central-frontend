import type { Accessor } from 'solid-js';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { NoteNodeDefinition } from '../../parse/model/NoteNodeDefinition.ts';
import { resolveDependencyNodesets } from '../../parse/xpath/dependency-analysis.ts';
import { createComputedExpression } from './createComputedExpression.ts';

export const createNoteReadonlyThunk = (
	context: EvaluationContext,
	definition: NoteNodeDefinition
): Accessor<true> => {
	const { reference } = definition.bodyElement;
	const { readonly } = definition.bind;

	if (!readonly.isConstantTruthyExpression()) {
		throw new Error('Expected a static readonly expression');
	}

	let result = true;

	if (import.meta.env.DEV) {
		const { expression } = readonly;
		const dependencyReferences = resolveDependencyNodesets(reference, expression);

		if (dependencyReferences.length > 0) {
			throw new Error(`Expected expression ${expression} to have no dependencies`);
		}

		const computedExpression = createComputedExpression(context, readonly);

		result = computedExpression();

		if (result !== true) {
			throw new Error(`Expected expression ${readonly.expression} to return true`);
		}
	}

	return () => result;
};
