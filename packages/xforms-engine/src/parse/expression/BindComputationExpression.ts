import type { BindDefinition } from '../model/BindDefinition.ts';
import { DependentExpression } from './abstract/DependentExpression.ts';

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
		? BindComputationExpression<Type> | null
		: BindComputationExpression<Type>;

const bindComputationResultTypes = {
	calculate: 'string',
	constraint: 'boolean',
	readonly: 'boolean',
	relevant: 'boolean',
	required: 'boolean',
	saveIncomplete: 'boolean',
} as const;

type BindComputationResultTypes = typeof bindComputationResultTypes;

export type BindComputationResultType<Computation extends BindComputationType> =
	BindComputationResultTypes[Computation];

export class BindComputationExpression<
	Computation extends BindComputationType,
> extends DependentExpression<BindComputationResultType<Computation>> {
	static forComputation<Type extends BindComputationType>(
		bind: BindDefinition,
		computation: Type
	): BindComputationFactoryResult<Type> {
		const expression =
			bind.bindElement.getAttribute(computation) ?? defaultBindComputationExpressions[computation];

		if (expression == null) {
			return null as BindComputationFactoryResult<Type>;
		}

		return new this(computation, expression);
	}

	readonly isDefaultExpression: boolean;

	protected constructor(
		readonly computation: Computation,
		expression: string | null
	) {
		let isDefaultExpression: boolean;
		let resolvedExpression: string;

		if (expression == null) {
			if (computation === 'calculate') {
				throw new Error('No default expression for calculate');
			}

			resolvedExpression =
				defaultBindComputationExpressions[computation as Exclude<Computation, 'calculate'>];
			isDefaultExpression = true;
		} else {
			isDefaultExpression = false;
			resolvedExpression = expression;
		}

		super(bindComputationResultTypes[computation], resolvedExpression);

		this.isDefaultExpression = isDefaultExpression;
	}
}
