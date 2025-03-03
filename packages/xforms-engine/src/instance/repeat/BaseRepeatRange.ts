import { insertAtIndex } from '@getodk/common/lib/array/insert.ts';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { untrack } from 'solid-js';
import type { RepeatRangeNode } from '../../client/hierarchy.ts';
import type { FormNodeID } from '../../client/identity.ts';
import type { NodeAppearances } from '../../client/NodeAppearances.ts';
import type { BaseRepeatRangeNode } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { SubmissionState } from '../../client/submission/SubmissionState.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import type {
	XFormsXPathNodeRange,
	XFormsXPathNodeRangeKind,
} from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { XFORMS_XPATH_NODE_RANGE_KIND } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { createNodeRangeSubmissionState } from '../../lib/client-reactivity/submission/createNodeRangeSubmissionState.ts';
import type { ChildrenState } from '../../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../../lib/reactivity/createChildrenState.ts';
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
	DescendantNodeSharedStateSpec,
} from '../abstract/DescendantNode.ts';
import { DescendantNode } from '../abstract/DescendantNode.ts';
import type { GeneralParentNode, RepeatRange } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableParentNode } from '../internal-api/submission/ClientReactiveSubmittableParentNode.ts';
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
	extends DescendantNode<Definition, RepeatRangeStateSpec, GeneralParentNode, RepeatInstance>
	implements
		BaseRepeatRangeNode,
		XFormsXPathNodeRange,
		EvaluationContext,
		ClientReactiveSubmittableParentNode<RepeatInstance>
{
	protected readonly childrenState: ChildrenState<RepeatInstance>;

	/**
	 * A repeat range doesn't have a corresponding primary instance element of its
	 * own. It is represented in the following ways:
	 *
	 * - As a comment node (in terms of XPath semantics), immediately preceding
	 *   the repeat range's {@link RepeatInstance | repeat instances} (if it
	 *   presently has any; as a placeholder where they may be appended
	 *   otherwise). This is necessary to support certain ODK XForms functionality
	 *   where an expression is expected to be evaluated against "repeats" as a
	 *   conceptual unit. Most typically, this includes:
	 *
	 *   - `jr:count` expressions associated with the repeat's body element
	 *   - `relevant` bind computations associated with the repeat's nodeset
	 *
	 * - As a subtree with {@link RepeatInstance | repeat instance} **children**,
	 *   in service of the client-facing {@link RepeatRangeNode} API (and with the
	 *   same structural semantics internally)
	 *
	 * Ultimately, this means there is a fundamental impedance mismatch between
	 * two representations which are either necessary (XPath) or high value
	 * (providing a coherent mental model for clients and the engine
	 * implementation servicing that client-facing model).
	 *
	 * In recognition that this is a truly odd mix of inherent and incidental
	 * complexity, here we use the special {@link XFormsXPathNodeRangeKind}
	 * branded type as a dedicated point of (internal) documentation where the two
	 * models diverge.
	 */
	override readonly [XPathNodeKindKey]: XFormsXPathNodeRangeKind = XFORMS_XPATH_NODE_RANGE_KIND;

	// InstanceNode
	protected readonly state: SharedNodeState<RepeatRangeStateSpec>;
	protected readonly engineState: EngineState<RepeatRangeStateSpec>;

	// DescendantNode
	/**
	 * @todo Should we special case repeat `readonly` state the same way
	 * we do for `relevant`?
	 *
	 * @see {@link isSelfRelevant}
	 */
	declare isSelfReadonly: Accessor<boolean>;

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

	readonly nodeOptions = null;

	readonly currentState: MaterializedChildren<CurrentState<RepeatRangeStateSpec>, RepeatInstance>;

	abstract override readonly validationState: AncestorNodeValidationState;

	readonly submissionState: SubmissionState;

	constructor(parent: GeneralParentNode, definition: Definition) {
		super(parent, definition);

		const repeatRange = this as AnyDescendantNode as RepeatRange;

		const childrenState = createChildrenState<RepeatRange, RepeatInstance>(repeatRange);

		this.childrenState = childrenState;

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
				const newInstance = new RepeatInstance(repeatRange, definition, {
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

	getChildren(): readonly RepeatInstance[] {
		return this.childrenState.getChildren();
	}
}
