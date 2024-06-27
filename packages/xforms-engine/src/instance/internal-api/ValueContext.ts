import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputation } from '../../model/BindComputation.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export type InstanceValue = string;

interface ValueContextDefinitionBind {
	readonly calculate: BindComputation<'calculate'> | null;
	readonly readonly: BindComputation<'readonly'>;
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
