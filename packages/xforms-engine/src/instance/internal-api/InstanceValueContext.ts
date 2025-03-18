import type { FormInstanceInitializationMode } from '../../client/index.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { AnyBindPreloadDefinition } from '../../parse/model/BindPreloadDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export interface InstanceValueContextDocument {
	readonly initializationMode: FormInstanceInitializationMode;
}

export type DecodeInstanceValue = (value: string) => string;

interface InstanceValueContextDefinitionBind {
	readonly preload: AnyBindPreloadDefinition | null;
	readonly calculate: BindComputationExpression<'calculate'> | null;
	readonly readonly: BindComputationExpression<'readonly'>;
}

export interface InstanceValueContextDefinition {
	readonly bind: InstanceValueContextDefinitionBind;
	readonly template: StaticLeafElement;
}

export interface InstanceValueContext extends EvaluationContext {
	readonly scope: ReactiveScope;
	readonly rootDocument: InstanceValueContextDocument;
	readonly definition: InstanceValueContextDefinition;
	readonly instanceNode: StaticLeafElement | null;
	readonly decodeInstanceValue: DecodeInstanceValue;

	isReadonly(): boolean;
	isRelevant(): boolean;
}
