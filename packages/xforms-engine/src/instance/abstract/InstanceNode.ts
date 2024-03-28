import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor, Signal } from 'solid-js';
import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type { TextRange } from '../../index.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createReactiveScope, type ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { SimpleAtomicState } from '../../lib/reactivity/types.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { RepeatInstance } from '../RepeatInstance.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyParentNode, GeneralChildNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { InstanceConfig } from '../internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';

export interface InstanceNodeState extends BaseNodeState {
	get children(): readonly AnyChildNode[] | null;
}

// prettier-ignore
type InstanceNodeChildrenSpec =
	| Signal<readonly GeneralChildNode[]>
	| Signal<readonly RepeatInstance[]>
	| null;

export interface InstanceNodeStateSpec<Value = never> {
	readonly reference: Accessor<string> | string;
	readonly readonly: Accessor<boolean> | boolean;
	readonly relevant: Accessor<boolean> | boolean;
	readonly required: Accessor<boolean> | boolean;
	readonly label: Accessor<TextRange<'label'> | null> | null;
	readonly hint: Accessor<TextRange<'hint'> | null> | null;
	readonly children: InstanceNodeChildrenSpec;
	readonly valueOptions: Accessor<null> | Accessor<readonly unknown[]> | null;
	readonly value: Signal<Value> | SimpleAtomicState<Value> | null;
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends InstanceNodeStateSpec<any>,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	protected abstract readonly state: SharedNodeState<Spec>;
	protected abstract readonly engineState: EngineState<Spec>;

	// BaseNode: identity
	readonly nodeId: string;

	// BaseNode: node-specific
	readonly definition: Definition;

	abstract readonly currentState: CurrentState<Spec>;

	// BaseNode: instance-global/shared
	readonly engineConfig: InstanceConfig;

	// BaseNode: structural
	abstract readonly root: Root;
	abstract readonly parent: AnyParentNode | null;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: XFormsXPathEvaluator;

	// EvaluationContext *and* Subscribable: node-specific
	readonly scope: ReactiveScope;

	// EvaluationContext: node-specific
	get contextReference(): string {
		return this.engineState.reference;
	}

	abstract readonly contextNode: Element;

	constructor(engineConfig: InstanceConfig, definition: Definition) {
		this.scope = createReactiveScope();
		this.engineConfig = engineConfig;
		this.nodeId = engineConfig.createUniqueId();
		this.definition = definition;
	}

	// EvaluationContext: node-relative
	abstract getSubscribableDependencyByReference(reference: string): SubscribableDependency | null;

	// SubscribableDependency: node-specific
	abstract subscribe(): void;
}
