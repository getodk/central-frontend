import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { MessageDefinition } from '../../parse/text/MessageDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';
import type { SubscribableDependency } from './SubscribableDependency.ts';

interface ValidationContextDefinitionBind {
	readonly constraint: BindComputationExpression<'constraint'>;
	readonly constraintMsg: MessageDefinition<'constraintMsg'> | null;
	readonly required: BindComputationExpression<'required'>;
	readonly requiredMsg: MessageDefinition<'requiredMsg'> | null;
}

interface ValidationContextDefinition {
	readonly bind: ValidationContextDefinitionBind;
}

export interface ValidationContext extends EvaluationContext, SubscribableDependency {
	readonly definition: ValidationContextDefinition;

	isRelevant(): boolean;
	isRequired(): boolean;
	isBlank(): boolean;
}
