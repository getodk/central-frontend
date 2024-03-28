import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type { EngineConfig } from '../../client/EngineConfig.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';

export interface InstanceNodeState extends BaseNodeState {
	get children(): readonly AnyChildNode[] | null;
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		State extends InstanceNodeState,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	// BaseNode: identity
	abstract readonly nodeId: string;

	// BaseNode: node-specific
	readonly definition: Definition;

	abstract readonly currentState: State;

	// BaseNode: instance-global/shared
	abstract readonly engineConfig: EngineConfig;

	// BaseNode: structural
	abstract readonly root: Root;
	abstract readonly parent: AnyParentNode | null;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: XFormsXPathEvaluator;

	// EvaluationContext *and* Subscribable: node-specific
	abstract readonly scope: ReactiveScope;

	// EvaluationContext: node-specific
	abstract get contextReference(): string;
	abstract readonly contextNode: Element;

	constructor(definition: Definition) {
		this.definition = definition;
	}

	// EvaluationContext: node-relative
	abstract getSubscribableDependencyByReference(reference: string): SubscribableDependency | null;

	// SubscribableDependency: node-specific
	abstract subscribe(): void;
}
