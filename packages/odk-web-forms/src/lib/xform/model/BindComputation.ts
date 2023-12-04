import { DependentExpression } from '../expression/DependentExpression.ts';
import type { BindDefinition } from './BindDefinition.ts';

const defaultBindComputationExpressions = {
	calculate: null,
	constraint: 'true()',
	readonly: 'false()',
	relevant: 'true()',
	required: 'false()',
	saveIncomplete: 'false()',
} as const;

type DefaultBindComputationExpressions = typeof defaultBindComputationExpressions;

export type BindComputationType = keyof DefaultBindComputationExpressions;

type BindComputationFactoryResult<Type extends BindComputationType> =
	DefaultBindComputationExpressions[Type] extends null
		? BindComputation<Type> | null
		: BindComputation<Type>;

export class BindComputation<Type extends BindComputationType> extends DependentExpression {
	static forExpression<Type extends BindComputationType>(
		bind: BindDefinition,
		computation: Type
	): BindComputationFactoryResult<Type> {
		const expression =
			bind.bindElement.getAttribute(computation) ?? defaultBindComputationExpressions[computation];

		if (expression == null) {
			return null as BindComputationFactoryResult<Type>;
		}

		return new this(bind, computation, expression);
	}

	protected constructor(
		bind: BindDefinition,
		readonly computation: Type,
		expression: string
	) {
		const isInherited = computation === 'readonly' || computation === 'relevant';
		const ignoreContextReference = computation === 'constraint';

		super(bind, expression, {
			ignoreContextReference,
			semanticDependencies: {
				parentContext: isInherited,
			},
		});
	}
}
