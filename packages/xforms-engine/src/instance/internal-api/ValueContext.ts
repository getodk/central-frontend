import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export type InstanceValue = string;

interface ValueContextDefinitionBind {
	readonly calculate: BindComputationExpression<'calculate'> | null;
	readonly readonly: BindComputationExpression<'readonly'>;
}

export interface ValueContextDefinition {
	readonly bind: ValueContextDefinitionBind;
	readonly defaultValue: InstanceValue;
}

export interface ValueContext<RuntimeValue> extends EvaluationContext {
	readonly scope: ReactiveScope;
	readonly definition: ValueContextDefinition;
	readonly contextNode: Element;

	isReadonly(): boolean;
	isRelevant(): boolean;

	readonly encodeValue: (this: unknown, runtimeValue: RuntimeValue) => InstanceValue;
	readonly decodeValue: (this: unknown, instanceValue: InstanceValue) => RuntimeValue;
}
