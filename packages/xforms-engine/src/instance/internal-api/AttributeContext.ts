import type { Accessor } from 'solid-js';
import type { FormInstanceInitializationMode } from '../../client/index.ts';
import type { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { BindComputationExpression } from '../../parse/expression/BindComputationExpression.ts';
import type { AnyBindPreloadDefinition } from '../../parse/model/BindPreloadDefinition.ts';
import type { ModelDefinition } from '../../parse/model/ModelDefinition.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

export interface InstanceAttributeContextDocument {
	readonly initializationMode: FormInstanceInitializationMode;
	readonly isAttached: Accessor<boolean>;
}

export type DecodeInstanceValue = (value: string) => string;

interface InstanceAttributeContextDefinitionBind {
	readonly preload: AnyBindPreloadDefinition | null;
	readonly calculate: BindComputationExpression<'calculate'> | null;
	readonly readonly: BindComputationExpression<'readonly'>;
}

export interface InstanceAttributeContextDefinition {
	readonly bind: InstanceAttributeContextDefinitionBind;
	readonly template: StaticAttribute;
	readonly model: ModelDefinition;
}

export interface AttributeContext extends EvaluationContext {
	readonly scope: ReactiveScope;
	readonly rootDocument: InstanceAttributeContextDocument;
	readonly definition: InstanceAttributeContextDefinition;
	readonly instanceNode: StaticAttribute;
	readonly decodeInstanceValue: DecodeInstanceValue;

	isReadonly(): boolean;
	isRelevant(): boolean;
}
