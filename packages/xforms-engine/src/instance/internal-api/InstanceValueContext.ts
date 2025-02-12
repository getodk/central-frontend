import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { AnyBindPreloadDefinition } from '../../parse/model/BindPreloadDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export type DecodeInstanceValue = (value: string) => string;

interface InstanceValueContextDefinitionBind {
	readonly preload: AnyBindPreloadDefinition | null;
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
	readonly decodeInstanceValue: DecodeInstanceValue;

	isReadonly(): boolean;
	isRelevant(): boolean;
}
