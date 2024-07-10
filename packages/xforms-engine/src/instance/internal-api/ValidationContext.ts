import type { BindComputation } from '../../model/BindComputation.ts';
import type { MessageDefinition } from '../../parse/text/MessageDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';
import type { SubscribableDependency } from './SubscribableDependency.ts';

interface ValidationContextDefinitionBind {
	readonly constraint: BindComputation<'constraint'>;
	readonly constraintMsg: MessageDefinition<'constraintMsg'> | null;
	readonly required: BindComputation<'required'>;
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
