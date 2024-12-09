import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

interface InstanceValueContextDefinitionBind {
	readonly calculate: BindComputationExpression<'calculate'> | null;
	readonly readonly: BindComputationExpression<'readonly'>;
}

export interface InstanceValueContextDefinition {
	readonly bind: InstanceValueContextDefinitionBind;
	readonly defaultValue: string;
}

export interface InstanceValueContext extends EvaluationContext {
	readonly scope: ReactiveScope;
	readonly definition: InstanceValueContextDefinition;

	isReadonly(): boolean;
	isRelevant(): boolean;
}
