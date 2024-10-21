import { insertAtIndex } from '@getodk/common/lib/array/insert.ts';
import { untrack, type Accessor } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';
import type { NodeAppearances } from '../../client/NodeAppearances.ts';
import type { BaseRepeatRangeNode } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { SubmissionState } from '../../client/submission/SubmissionState.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import { createNodeRangeSubmissionState } from '../../lib/client-reactivity/submission/createNodeRangeSubmissionState.ts';
import type { ChildrenState } from '../../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../../lib/reactivity/createChildrenState.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { MaterializedChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createNodeLabel } from '../../lib/reactivity/text/createNodeLabel.ts';
import type {
	AnyRepeatRangeDefinition,
	ControlledRepeatRangeDefinition,
} from '../../parse/model/RepeatRangeDefinition.ts';
import type {
	AnyDescendantNode,
	DescendantNodeParent,
	DescendantNodeSharedStateSpec,
} from '../abstract/DescendantNode.ts';
import { DescendantNode } from '../abstract/DescendantNode.ts';
import type { RepeatRange } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableParentNode } from '../internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import { RepeatInstance, type RepeatDefinition } from './RepeatInstance.ts';

interface RepeatRangeStateSpec extends DescendantNodeSharedStateSpec {
	readonly hint: null;
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

// prettier-ignore
type BaseRepeatRangeNodeType<Definition extends AnyRepeatRangeDefinition> =
	Definition extends ControlledRepeatRangeDefinition
		? 'repeat-range:controlled'
		: 'repeat-range:uncontrolled';

export abstract class BaseRepeatRange<Definition extends AnyRepeatRangeDefinition>
	extends DescendantNode<Definition, RepeatRangeStateSpec, RepeatInstance>
	implements
		BaseRepeatRangeNode,
		EvaluationContext,
		SubscribableDependency,
		ClientReactiveSubmittableParentNode<RepeatInstance>
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
	protected readonly anchorNode: Comment;

	protected readonly childrenState: ChildrenState<RepeatInstance>;

	/**
	 * Provides an {@link EvaluationContext} from which to evaluate expressions
	 * where some LocationPath sub-expressions may be **relative to the repeat
	 * range itself**. This is useful for evaluation of expressions where:
	 *
	 * - the expression is typically contextualized to any of its
	 *   {@link RepeatInstance} children, but it presently has none (i.e.
	 *   `relevant`)
	 *
	 * - the expression is conceptually intended to be evaluated in the context of
	 *   the repeat range itself (i.e. `jr:count`)
	 */
	protected readonly selfEvaluationContext: EvaluationContext & {
		readonly contextNode: Comment;
	};

	/**
	 * @see {@link isSelfRelevant}
	 */
	protected readonly isEmptyRangeSelfRelevant: Accessor<boolean>;

	// InstanceNode
	protected readonly state: SharedNodeState<RepeatRangeStateSpec>;
	protected override engineState: EngineState<RepeatRangeStateSpec>;

	// DescendantNode
	/**
	 * @todo Should we special case repeat `readonly` state the same way
	 * we do for `relevant`?
	 *
	 * @see {@link isSelfRelevant}
	 */
	declare isSelfReadonly: Accessor<boolean>;

	/**
	 * A repeat range does not exist in the primary instance tree. A `relevant`
	 * expression applies to each {@link RepeatInstance} child of the repeat
	 * range. Determining whether a repeat range itself "is relevant" isn't a
	 * concept the spec addresses, but it may be used by clients to determine
	 * whether to allow interaction with the range (e.g. by adding a repeat
	 * instance, or presenting the range's label when empty).
	 *
	 * As a naive first pass, it seems like the heuristic for this should be:
	 *
	 * 1. Does the repeat range have any repeat instance children?
	 *
	 *     - If yes, go to 2.
	 *     - If no, go to 3.
	 *
	 * 2. Does one or more of those children return `true` for the node's
	 *    `relevant` expression (i.e. is the repeat instance "self relevant")?
	 *
	 * 3. Does the relevant expression return `true` for the repeat range itself
	 *    (where, at least for now, the context of that evaluation would be the
	 *    repeat range's {@link anchorNode} to ensure correct relative expressions
	 *    resolve correctly)?
	 *
	 * @todo While (3) is proactively implemented, there isn't presently a test
	 * exercising it. It felt best for now to surface this for discussion in
	 * review to validate that it's going in the right direction.
	 *
	 * @todo While (2) **is actually tested**, the tests currently in place behave
	 * the same way with only the logic for (3), regardless of whether the repeat
	 * range actually has any repeat instance children. It's unclear (a) if that's
	 * a preferable simplification and (b) how that might affect performance (in
	 * theory it could vary depending on form structure and runtime state).
	 */
	override readonly isSelfRelevant: Accessor<boolean> = () => {
		const instances = this.childrenState.getChildren();

		if (instances.length > 0) {
			return instances.some((instance) => instance.isSelfRelevant());
		}

		return this.isEmptyRangeSelfRelevant();
	};

	// BaseRepeatRangeNode
	abstract override readonly nodeType: BaseRepeatRangeNodeType<Definition>;

	/**
	 * @todo RepeatRange*, RepeatInstance* (and RepeatTemplate*) all share the
	 * same body element, and thus all share the same definition `bodyElement`. As
	 * such, they also all share the same `appearances`. At time of writing,
	 * `web-forms` (Vue UI package) treats a `RepeatRangeNode`...
	 *
	 * - ... as a group, if the node has a label (i.e.
	 *   `<group><label/><repeat/></group>`)
	 * - ... effectively as a fragment containing only its instances, otherwise
	 *
	 * We now collapse `<group><repeat>` into `<repeat>`, and no longer treat
	 * "repeat group" as a concept (after parsing). According to the spec, these
	 * appearances **are supposed to** come from that "repeat group" in the form
	 * definition. In practice, many forms do define appearances directly on a
	 * repeat element. The engine currently produces an error if both are defined
	 * simultaneously, but otherwise makes no distinction between appearances in
	 * these form definition shapes:
	 *
	 * ```xml
	 * <group ref="/data/rep1" appearance="...">
	 *   <repeat nodeset="/data/rep1"/>
	 * </group>
	 *
	 * <group ref="/data/rep1">
	 *   <repeat nodeset="/data/rep1"/ appearance="...">
	 * </group>
	 *
	 * <repeat nodeset="/data/rep1"/ appearance="...">
	 * ```
	 *
	 * All of the above creates considerable ambiguity about where "repeat
	 * appearances" should apply, under which circumstances.
	 */
	abstract override readonly appearances: NodeAppearances<Definition>;

	readonly currentState: MaterializedChildren<CurrentState<RepeatRangeStateSpec>, RepeatInstance>;

	abstract override readonly validationState: AncestorNodeValidationState;

	readonly submissionState: SubmissionState;

	constructor(parent: DescendantNodeParent<Definition>, definition: Definition) {
		super(parent, definition);

		const repeatRange = this as AnyDescendantNode as RepeatRange;

		const childrenState = createChildrenState<RepeatRange, RepeatInstance>(repeatRange);

		this.childrenState = childrenState;

		this.anchorNode = this.contextNode.ownerDocument.createComment(
			`Begin repeat range: ${definition.nodeset}`
		);
		this.contextNode.append(this.anchorNode);

		this.selfEvaluationContext = {
			scope: this.scope,
			evaluator: this.evaluator,
			root: this.root,
			contextReference: this.contextReference,
			contextNode: this.anchorNode,

			getSubscribableDependenciesByReference: (reference) => {
				return repeatRange.getSubscribableDependenciesByReference(reference);
			},
		};

		this.isEmptyRangeSelfRelevant = createComputedExpression(
			this.selfEvaluationContext,
			definition.bind.relevant
		);

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const state = createSharedNodeState(
			this.scope,
			{
				reference: this.contextReference,
				readonly: this.isReadonly,
				relevant: this.isRelevant,
				required: this.isRequired,

				label: createNodeLabel(this, definition),
				hint: null,
				children: childrenState.childIds,
				valueOptions: null,
				value: null,
			},
			sharedStateOptions
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(
			this.scope,
			state.currentState,
			childrenState
		);
		this.submissionState = createNodeRangeSubmissionState(this);
	}

	protected getLastIndex(): number {
		return this.engineState.children.length - 1;
	}

	protected override initializeContextNode(parentContextNode: Element): Element {
		return parentContextNode;
	}

	getInstanceIndex(instance: RepeatInstance): number {
		return this.engineState.children.indexOf(instance.nodeId);
	}

	private createChildren(
		afterIndex: number,
		definitions: readonly RepeatDefinition[]
	): readonly RepeatInstance[] {
		return this.scope.runTask(() => {
			let initialPrecedingInstance: RepeatInstance | null;

			if (afterIndex === -1) {
				initialPrecedingInstance = null;
			} else {
				const instance = untrack(() => this.childrenState.getChildren()[afterIndex]);

				if (instance == null) {
					throw new Error(`No repeat instance at index ${afterIndex}`);
				}

				initialPrecedingInstance = instance;
			}

			const repeatRange = this as AnyDescendantNode as RepeatRange;

			return definitions.reduce<RepeatInstance[]>((acc, definition) => {
				const precedingInstance = acc[acc.length - 1] ?? initialPrecedingInstance;
				const precedingPrimaryInstanceNode = precedingInstance?.contextNode ?? this.anchorNode;
				const newInstance = new RepeatInstance(repeatRange, definition, {
					precedingPrimaryInstanceNode,
					precedingInstance,
				});

				acc.push(newInstance);

				return acc;
			}, []);
		});
	}

	protected addChildren(
		afterIndex: number,
		definitions: readonly RepeatDefinition[]
	): readonly RepeatInstance[] {
		return this.scope.runTask(() => {
			const initialIndex = afterIndex + 1;
			const newInstances = this.createChildren(afterIndex, definitions);

			return this.childrenState.setChildren((currentInstances) => {
				return insertAtIndex(currentInstances, initialIndex, newInstances);
			});
		});
	}

	protected removeChildren(startIndex: number, count: number): readonly RepeatInstance[] {
		return this.scope.runTask(() => {
			return this.childrenState.setChildren((currentInstances) => {
				const updatedInstances = currentInstances.slice();
				const removedInstances = updatedInstances.splice(startIndex, count);

				removedInstances.forEach((instance) => {
					instance.remove();
				});

				return updatedInstances;
			});
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
