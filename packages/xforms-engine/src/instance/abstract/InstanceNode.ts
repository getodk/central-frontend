import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Signal } from 'solid-js';
import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { StatePropertySpec } from '../../lib/reactivity/node-state/createSpecifiedState.ts';
import { createReactiveScope, type ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { InstanceConfig } from '../internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';

export interface InstanceNodeState extends BaseNodeState {
	get children(): readonly AnyChildNode[] | null;
}

// prettier-ignore
type InstanceNodeStateChildrenSpec<Children> =
	Children extends null
		? null
		: Signal<Children>;

// prettier-ignore
type BaseInstanceNodeStateSpec<State extends InstanceNodeState> = {
	[K in keyof State]:
		K extends 'children'
			? InstanceNodeStateChildrenSpec<State[K]>
			: StatePropertySpec<State[K]>;
};

// prettier-ignore
export type InstanceNodeStateSpec<
	State extends InstanceNodeState,
	Overrides = never
> =
	& Omit<BaseInstanceNodeStateSpec<State>, keyof Overrides>
	& Overrides;

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		State extends InstanceNodeState,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	protected abstract readonly engineState: EngineState<State>;

	// BaseNode: identity
	readonly nodeId: string;

	// BaseNode: node-specific
	readonly definition: Definition;

	abstract readonly currentState: CurrentState<State>;

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
