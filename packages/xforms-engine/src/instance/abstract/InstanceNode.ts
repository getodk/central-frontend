import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { BaseNode } from '../../client/BaseNode.ts';
import type { InstanceNodeType } from '../../client/node-types.ts';
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

interface InitializedStateOptions<T, K extends keyof T> {
	readonly uninitializedFallback: T[K];
}

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

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends InstanceNodeStateSpec<any>,
		Child extends AnyChildNode | null = null,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	protected readonly isStateInitialized: Accessor<boolean>;
	protected readonly initializationFailure: Promise<Error | null>;

	protected abstract readonly state: SharedNodeState<Spec>;
	protected abstract readonly engineState: EngineState<Spec>;

	/**
	 * Provides a generalized mechanism for accessing a reactive state value
	 * during a node's construction, while {@link engineState} is still being
	 * defined and thus isn't assigned.
	 *
	 * The fallback value specified in {@link options} will be returned on access
	 * until {@link isStateInitialized} returns true. This ensures:
	 *
	 * - a value of the expected type will be available
	 * - any read access will become reactive to the actual state, once it has
	 *   been initialized and {@link engineState} is assigned
	 *
	 * @todo This is one among several chicken/egg problems encountered trying to
	 * support state initialization in which some aspects of the state derive from
	 * other aspects of it. It would be nice to dispense with this entirely. But
	 * if it must persist, we should also consider replacing the method with a
	 * direct accessor once state initialization completes, so the initialized
	 * check is only called until it becomes impertinent.
	 */
	protected getInitializedState<K extends keyof EngineState<Spec>>(
		key: K,
		options: InitializedStateOptions<EngineState<Spec>, K>
	): EngineState<Spec>[K] {
		if (this.isStateInitialized()) {
			return this.engineState[key];
		}

		return options.uninitializedFallback;
	}

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	get isReadonly(): boolean {
		return (this as AnyInstanceNode).getInitializedState('readonly', {
			uninitializedFallback: false,
		});
	}

	/**
	 * @package Exposed on every node type to facilitate inheritance, as well as
	 * conditional behavior for value nodes.
	 */
	get isRelevant(): boolean {
		return (this as AnyInstanceNode).getInitializedState('relevant', {
			uninitializedFallback: true,
		});
	}

	// BaseNode: identity
	readonly nodeId: NodeID;

	// BaseNode: node types and variants (e.g. for narrowing)
	abstract readonly nodeType: InstanceNodeType;

	abstract readonly currentState: InstanceNodeCurrentState<Spec, Child>;

	// BaseNode: structural
	abstract readonly root: Root;

	// EvaluationContext: instance-global/shared
	abstract readonly evaluator: XFormsXPathEvaluator;

	// EvaluationContext *and* Subscribable: node-specific
	readonly scope: ReactiveScope;

	// EvaluationContext: node-specific
	get contextReference(): string {
		return this.computeReference(this.parent, this.definition);
	}

	abstract readonly contextNode: Element;

	constructor(
		readonly engineConfig: InstanceConfig,
		readonly parent: AnyParentNode | null,
		readonly definition: Definition
	) {
		this.scope = createReactiveScope();
		this.engineConfig = engineConfig;
		this.nodeId = declareNodeID(engineConfig.createUniqueId());
		this.definition = definition;

		const checkStateInitialized = () => this.engineState != null;
		const [isStateInitialized, setStateInitialized] = createSignal(checkStateInitialized());

		this.isStateInitialized = isStateInitialized;

		this.initializationFailure = new Promise<Error | null>((resolve) => {
			queueMicrotask(() => {
				if (checkStateInitialized()) {
					setStateInitialized(true);
					resolve(null);
				} else {
					resolve(new Error('Node state was never initialized'));
				}
			});
		});
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

	protected abstract computeReference(
		parent: AnyInstanceNode | null,
		definition: Definition
	): string;

	getNodeByReference(
		this: AnyNode,
		visited: WeakSet<AnyNode>,
		dependencyReference: string
	): SubscribableDependency | null {
		if (visited.has(this)) {
			return null;
		}

		visited.add(this);

		const { nodeset } = this.definition;

		if (dependencyReference === nodeset) {
			return this;
		}

		if (
			dependencyReference.startsWith(`${nodeset}/`) ||
			dependencyReference.startsWith(`${nodeset}[`)
		) {
			const children = this.getChildren();

			if (children == null) {
				return null;
			}

			for (const child of children) {
				const dependency = child.getNodeByReference(visited, dependencyReference);

				if (dependency != null) {
					return dependency;
				}
			}
		}

		return this.parent?.getNodeByReference(visited, dependencyReference) ?? null;
	}

	// EvaluationContext: node-relative
	getSubscribableDependencyByReference(
		this: AnyNode,
		reference: string
	): SubscribableDependency | null {
		const visited = new WeakSet<SubscribableDependency>();

		return this.getNodeByReference(visited, reference);
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
