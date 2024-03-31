import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { BaseNode, BaseNodeState } from '../../client/BaseNode.ts';
import type { TextRange } from '../../index.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import { createReactiveScope } from '../../lib/reactivity/scope.ts';
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

type AnyInstanceNode = InstanceNode<
	AnyNodeDefinition,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	InstanceNodeStateSpec<any>
>;

interface InitializedStateOptions<T, K extends keyof T> {
	readonly uninitializedFallback: T[K];
}

export abstract class InstanceNode<
		Definition extends AnyNodeDefinition,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Spec extends InstanceNodeStateSpec<any>,
	>
	implements BaseNode, EvaluationContext, SubscribableDependency
{
	protected readonly isStateInitialized: Accessor<boolean>;

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
	readonly nodeId: string;

	abstract readonly currentState: CurrentState<Spec>;

	// BaseNode: instance-global/shared
	readonly engineConfig: InstanceConfig;

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
		engineConfig: InstanceConfig,
		readonly parent: AnyParentNode | null,
		readonly definition: Definition
	) {
		this.scope = createReactiveScope();
		this.engineConfig = engineConfig;
		this.nodeId = engineConfig.createUniqueId();
		this.definition = definition;

		const checkStateInitialized = () => this.engineState != null;
		const [isStateInitialized, setStateInitialized] = createSignal(checkStateInitialized());

		this.isStateInitialized = isStateInitialized;

		queueMicrotask(() => {
			if (checkStateInitialized()) {
				setStateInitialized(true);
			} else {
				throw new Error('Node state was never initialized');
			}
		});
	}

	protected abstract computeReference(
		parent: AnyInstanceNode | null,
		definition: Definition
	): string;

	getNodeByReference(
		this: AnyInstanceNode,
		visited: WeakSet<AnyInstanceNode>,
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
			const children = this.getInitializedState('children', {
				uninitializedFallback: [],
			});

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
		this: AnyInstanceNode,
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
