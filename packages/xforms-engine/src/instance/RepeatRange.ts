import type { Accessor } from 'solid-js';
import type { RepeatRangeNode } from '../client/RepeatRangeNode.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createNodeLabel } from '../lib/reactivity/text/createNodeLabel.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import type { RepeatDefinition } from './RepeatInstance.ts';
import { RepeatInstance } from './RepeatInstance.ts';
import type { Root } from './Root.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { NodeID } from './identity.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { TextRange } from './text/TextRange.ts';

interface RepeatRangeStateSpec extends DescendantNodeSharedStateSpec {
	readonly hint: null;
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly children: Accessor<readonly NodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class RepeatRange
	extends DescendantNode<RepeatSequenceDefinition, RepeatRangeStateSpec, RepeatInstance>
	implements RepeatRangeNode, EvaluationContext, SubscribableDependency
{
	/**
	 * A repeat range doesn't have a corresponding primary instance element of its
	 * own, and its instances are appended to the range's parent element. During
	 * creation of the initial primary instance state and DOM trees, we _could_
	 * reliably append all of the range's instances in order as the definition
	 * tree is recursed. But that would fail to handle some instance addition
	 * cases afterwards.
	 *
	 * Most notably, we need to know where in the primary instance tree to append
	 * instances created for a range which is currently empty. As a lucky
	 * coincidence, this need coincides with the ability to add instances at any
	 * arbitrary index within the range. In each case, we can reference a primary
	 * instance DOM node which will become the new instance's preceding sibling.
	 * Where the range is empty, we use this {@link Comment} node (itself created
	 * and appended during range initialization) in lieu of a nonexistent
	 * preceding instance's {@link contextNode}.
	 *
	 * @todo We likely want to remove these during submission serialization.
	 * @todo Can we use a
	 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Range | DOM Range}
	 * instead?
	 */
	private readonly anchorNode: Comment;

	private readonly childrenState: ChildrenState<RepeatInstance>;

	// InstanceNode
	protected readonly state: SharedNodeState<RepeatRangeStateSpec>;
	protected override engineState: EngineState<RepeatRangeStateSpec>;

	// RepeatRangeNode
	readonly nodeType = 'repeat-range';
	readonly nodeVariant = null;

	readonly currentState: MaterializedChildren<CurrentState<RepeatRangeStateSpec>, RepeatInstance>;

	constructor(parent: GeneralParentNode, definition: RepeatSequenceDefinition) {
		super(parent, definition);

		const childrenState = createChildrenState<RepeatRange, RepeatInstance>(this);

		this.childrenState = childrenState;

		const state = createSharedNodeState(
			this.scope,
			{
				...this.buildSharedStateSpec(parent, definition),

				label: createNodeLabel(this, definition),
				hint: null,
				children: childrenState.childIds,
				valueOptions: null,
				value: null,
			},
			{
				clientStateFactory: this.engineConfig.stateFactory,
			}
		);

		this.anchorNode = this.contextNode.ownerDocument.createComment(
			`Begin repeat range: ${definition.nodeset}`
		);
		this.contextNode.append(this.anchorNode);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(state.currentState, childrenState);

		definition.instances.forEach((instanceDefinition, index) => {
			const afterIndex = index - 1;

			this.addInstances(afterIndex, 1, instanceDefinition);
		});
	}

	private getLastIndex(): number {
		return this.engineState.children.length - 1;
	}

	protected override initializeContextNode(parentContextNode: Element): Element {
		return parentContextNode;
	}

	protected computeReference(parent: GeneralParentNode): string {
		return this.computeChildStepReference(parent);
	}

	getInstanceIndex(instance: RepeatInstance): number {
		return this.engineState.children.indexOf(instance.nodeId);
	}

	addInstances(
		afterIndex = this.getLastIndex(),
		count = 1,
		definition: RepeatDefinition = this.definition.template
	): Root {
		return this.scope.runTask(() => {
			let precedingInstance: RepeatInstance | null;

			if (afterIndex === -1) {
				precedingInstance = null;
			} else {
				const instance = this.childrenState.getChildren()[afterIndex];

				if (instance == null) {
					throw new Error(`No repeat instance at index ${afterIndex}`);
				}

				precedingInstance = instance;
			}

			const precedingPrimaryInstanceNode = precedingInstance?.contextNode ?? this.anchorNode;

			const newInstance = new RepeatInstance(this, definition, {
				precedingPrimaryInstanceNode,
				precedingInstance,
			});
			const initialIndex = afterIndex + 1;

			this.childrenState.setChildren((currentInstances) => {
				if (precedingInstance == null) {
					return currentInstances.concat(newInstance);
				}

				return [
					...currentInstances.slice(0, initialIndex),
					newInstance,
					...currentInstances.slice(initialIndex),
				];
			});

			if (count > 1) {
				return this.addInstances(initialIndex, count - 1);
			}

			return this.root;
		});
	}

	removeInstances(startIndex: number, count = 1): Root {
		return this.scope.runTask(() => {
			this.childrenState.setChildren((currentInstances) => {
				const updatedInstances = currentInstances.slice();
				const removedInstances = updatedInstances.splice(startIndex, count);

				removedInstances.forEach((instance) => {
					instance.remove();
				});

				return updatedInstances;
			});

			return this.root;
		});
	}

	override subscribe(): void {
		super.subscribe();

		// Subscribing to children can support reactive expressions dependent on the
		// repeat range itself (e.g. `count()`).
		this.childrenState.getChildren().forEach((child) => {
			child.subscribe();
		});
	}

	getChildren(): readonly RepeatInstance[] {
		return this.childrenState.getChildren();
	}
}
