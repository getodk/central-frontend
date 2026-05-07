import {
	DependentExpression,
	type DependentExpressionResultType,
} from './abstract/DependentExpression.ts';

export class ActionComputationExpression<
	Type extends DependentExpressionResultType,
> extends DependentExpression<Type> {
	constructor(resultType: Type, expression: string) {
		super(resultType, expression);
	}
}
