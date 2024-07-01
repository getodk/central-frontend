import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor, Signal } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { NodeAppearances } from '../../client/NodeAppearances.ts';
import type { InstanceNodeType } from '../../client/node-types.ts';
import type { NodeValidationState } from '../../client/validation.ts';
import type { TextRange } from '../../index.ts';
import type { MaterializedChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import { createReactiveScope } from '../../lib/reactivity/scope.ts';
import type { SimpleAtomicState } from '../../lib/reactivity/types.ts';
import type { AnyNodeDefinition } from '../../model/NodeDefinition.ts';
import type { Root } from '../Root.ts';
import type { AnyChildNode, AnyNode, AnyParentNode } from '../hierarchy.ts';
import type { NodeID } from '../identity.ts';
import { declareNodeID } from '../identity.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { InstanceConfig } from '../internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';

export interface InstanceNodeStateSpec<Value = never> {
	readonly reference: Accessor<string> | string;
	readonly readonly: Accessor<boolean> | boolean;
	readonly relevant: Accessor<boolean> | boolean;
	readonly required: Accessor<boolean> | boolean;
	readonly label: Accessor<TextRange<'label'> | null> | null;
	readonly hint: Accessor<TextRange<'hint'> | null> | null;
	readonly children: Accessor<readonly NodeID[]> | null;
	readonly valueOptions: Accessor<null> | Accessor<readonly unknown[]> | null;
	readonly value: Signal<Value> | SimpleAtomicState<Value> | null;
}

type AnyInstanceNode = InstanceNode<
	AnyNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	InstanceNodeStateSpec<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	any
>;

/**
 * This type has the same effect as {@link MaterializedChildren}, but abstractly
 * handles leaf node types as well.
 */
// prettier-ignore
export type InstanceNodeCurrentState<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Spec extends InstanceNodeStateSpec<any>,
	Child
> =
	& CurrentState<Omit<Spec, 'children'>>
	& {
			readonly children: [Child] extends [AnyChildNode]
				? readonly Child[]
				: null;
		};

interface ComputableReferenceNode {
	readonly parent: AnyParentNode | null;
	readonly definition: AnyNodeDefinition;
}

type ComputeInstanceNodeReference = <This extends ComputableReferenceNode>(
	this: This,
	parent: This['parent'],
	definition: This['definition']
) => string;

export interface InstanceNodeOptions {
	readonly computeReference?: () => string;
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends InstanceNodeStateSpec<any>,
		Child extends AnyChildNode | null = null,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	protected abstract readonly state: SharedNodeState<Spec>;
	protected abstract readonly engineState: EngineState<Spec>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly hasReadonlyAncestor: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly isReadonly: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly hasNonRelevantAncestor: Accessor<boolean>;

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	abstract readonly isRelevant: Accessor<boolean>;

	// BaseNode: identity
	readonly nodeId: NodeID;

	// BaseNode: node types and variants (e.g. for narrowing)
	abstract readonly nodeType: InstanceNodeType;

	abstract readonly appearances: NodeAppearances<Definition>;

	abstract readonly currentState: InstanceNodeCurrentState<Spec, Child>;

	abstract readonly validationState: NodeValidationState;

	// BaseNode: structural
	abstract readonly root: Root;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: XFormsXPathEvaluator;

	// EvaluationContext *and* Subscribable: node-specific
	readonly scope: ReactiveScope;

	readonly computeReference: ComputeInstanceNodeReference;

	protected readonly computeChildStepReference: ComputeInstanceNodeReference = (
		parent,
		definition
	): string => {
		if (parent == null) {
			throw new Error(
				'Cannot compute child step reference of node without parent (was this called from `Root`?)'
			);
		}

		return `${parent.contextReference()}/${definition.nodeName}`;
	};

	// EvaluationContext: node-specific
	readonly contextReference = (): string => {
		return this.computeReference(this.parent, this.definition);
	};

	abstract readonly contextNode: Element;

	constructor(
		readonly engineConfig: InstanceConfig,
		readonly parent: AnyParentNode | null,
		readonly definition: Definition,
		options?: InstanceNodeOptions
	) {
		this.computeReference = options?.computeReference ?? this.computeChildStepReference;

		this.scope = createReactiveScope();
		this.engineConfig = engineConfig;
		this.nodeId = declareNodeID(engineConfig.createUniqueId());
		this.definition = definition;
	}

	/**
	 * @package This presently serves a few internal use cases, where certain
	 * behaviors depend on arbitrary traversal from any point in the instance
	 * tree, without particular regard for the visited node type. It isn't
	 * intended for external traversal or any other means of consuming children by
	 * a client. This return type intentionally deviates from one structural
	 * expectation, requiring even leaf nodes to return an array (though for those
	 * nodes it will always be empty). This affords consistency and efficiency of
	 * interface for those internal uses.
	 */
	abstract getChildren(this: AnyInstanceNode): readonly AnyChildNode[];

	getNodesByReference(
		this: AnyNode,
		visited: WeakSet<AnyNode>,
		dependencyReference: string
	): readonly SubscribableDependency[] {
		if (visited.has(this)) {
			return [];
		}

		visited.add(this);

		const { nodeset } = this.definition;

		if (dependencyReference === nodeset) {
			if (this.nodeType === 'repeat-instance') {
				return [this.parent];
			}

			return [this];
		}

		if (
			dependencyReference.startsWith(`${nodeset}/`) ||
			dependencyReference.startsWith(`${nodeset}[`)
		) {
			return this.getChildren().flatMap((child) => {
				return child.getNodesByReference(visited, dependencyReference);
			});
		}

		return this.parent?.getNodesByReference(visited, dependencyReference) ?? [];
	}

	// EvaluationContext: node-relative
	getSubscribableDependenciesByReference(
		this: AnyNode,
		reference: string
	): readonly SubscribableDependency[] {
		if (this.nodeType === 'root') {
			const visited = new WeakSet<AnyNode>();

			return this.getNodesByReference(visited, reference);
		}

		return this.root.getSubscribableDependenciesByReference(reference);
	}

	// SubscribableDependency
	/**
	 * This is a default implementation suitable for most node types. The rest
	 * (currently: `Root`, `RepeatRange`, `RepeatInstance`) should likely extend
	 * this behavior, rather than simply overriding it.
	 */
	subscribe(): void {
		const { engineState } = this;

		if (engineState.relevant) {
			engineState.reference;
			engineState.relevant;
			engineState.children;
			engineState.value;
		}
	}
}
