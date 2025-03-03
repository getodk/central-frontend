import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createComputed, createSignal, on } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';
import type {
	RepeatDefinition,
	RepeatInstanceNode,
	RepeatInstanceNodeAppearances,
} from '../../client/repeat/RepeatInstanceNode.ts';
import type { SubmissionState } from '../../client/submission/SubmissionState.ts';
import type { TextRange } from '../../client/TextRange.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import type { XFormsXPathElement } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import { createParentNodeSubmissionState } from '../../lib/client-reactivity/submission/createParentNodeSubmissionState.ts';
import type { ChildrenState } from '../../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../../lib/reactivity/node-state/createSharedNodeState.ts';
import { createNodeLabel } from '../../lib/reactivity/text/createNodeLabel.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { DescendantNodeSharedStateSpec } from '../abstract/DescendantNode.ts';
import { DescendantNode } from '../abstract/DescendantNode.ts';
import { buildChildren } from '../children.ts';
import type { GeneralChildNode, RepeatRange } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableParentNode } from '../internal-api/submission/ClientReactiveSubmittableParentNode.ts';

export type { RepeatDefinition };

interface RepeatInstanceStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: Accessor<TextRange<'label'> | null>;
	readonly hint: null;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

interface RepeatInstanceOptions {
	readonly precedingInstance: RepeatInstance | null;
}

export class RepeatInstance
	extends DescendantNode<RepeatDefinition, RepeatInstanceStateSpec, RepeatRange, GeneralChildNode>
	implements
		RepeatInstanceNode,
		XFormsXPathElement,
		EvaluationContext,
		ClientReactiveSubmittableParentNode<GeneralChildNode>
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;
	private readonly currentIndex: Accessor<number>;

	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<RepeatInstanceStateSpec>;
	protected readonly engineState: EngineState<RepeatInstanceStateSpec>;

	/**
	 * @todo Should we special case repeat `readonly` inheritance the same way
	 * we do for `relevant`?
	 *
	 * @see {@link hasNonRelevantAncestor}
	 */
	declare readonly hasReadonlyAncestor: Accessor<boolean>;

	/**
	 * A repeat instance can inherit non-relevance, just like any other node. That
	 * inheritance is derived from the repeat instance's parent node in the
	 * primary instance XML/DOM tree (and would be semantically expected to do so
	 * even if we move away from that implementation detail).
	 *
	 * Since {@link RepeatInstance.parent} is a {@link RepeatRange}, which is a
	 * runtime data model fiction that does not exist in that hierarchy, we pass
	 * this call through, allowing the {@link RepeatRange} to check the actual
	 * primary instance parent node's relevance state.
	 *
	 * @todo Should we apply similar reasoning in {@link hasReadonlyAncestor}?
	 */
	override readonly hasNonRelevantAncestor: Accessor<boolean> = () => {
		return this.parent.hasNonRelevantAncestor();
	};

	// RepeatInstanceNode
	readonly nodeType = 'repeat-instance';

	/**
	 * @see {@link RepeatRange.appearances}
	 */
	readonly appearances: RepeatInstanceNodeAppearances;
	readonly nodeOptions = null;

	readonly currentState: MaterializedChildren<
		CurrentState<RepeatInstanceStateSpec>,
		GeneralChildNode
	>;
	readonly validationState: AncestorNodeValidationState;
	readonly submissionState: SubmissionState;

	constructor(
		override readonly parent: RepeatRange,
		definition: RepeatDefinition,
		options: RepeatInstanceOptions
	) {
		const { precedingInstance } = options;
		const precedingIndex = precedingInstance?.currentIndex ?? (() => -1);
		const initialIndex = precedingIndex() + 1;
		const [currentIndex, setCurrentIndex] = createSignal(initialIndex);

		super(parent, definition, {
			computeReference: (): string => {
				const currentPosition = currentIndex() + 1;

				return `${parent.contextReference()}[${currentPosition}]`;
			},
		});

		this.appearances = definition.bodyElement.appearances;

		const childrenState = createChildrenState<RepeatInstance, GeneralChildNode>(this);

		this.childrenState = childrenState;
		this.currentIndex = currentIndex;

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

				// TODO: only-child <group><label>
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

		// Maintain current index state, updating as the parent range's children
		// state is changed. Notable Solid reactivity nuances:
		//
		// - `createComputed` is the Solid API which is explicitly called out for
		//   supporting performing reactive writes. It's also generally considered a
		//   "smell", but it seems the most appropriate for a first pass on this.
		// - `on(..., { defer: true })` allows us to *synchronously* delay reactive
		//   index updates until after the full form tree is built, where this
		//   `RepeatInstance` is being constructed but it hasn't yet been appended
		//   to the parent range's reactive `children`.
		// - the same logic for deferring reaction on form init should apply for
		//   adding new instances to a live form.
		this.scope.runTask(() => {
			// TODO: even as minimal as this currently is, maybe we should move this
			// into a named function under src/lib/reactivity (for consistency with
			// other reactive implementations of specific XForms semantics)?
			const computeCurrentIndex = parent.getInstanceIndex.bind(parent, this);

			createComputed(on<number, number>(computeCurrentIndex, setCurrentIndex, { defer: true }));
		});

		childrenState.setChildren(buildChildren(this));
		this.validationState = createAggregatedViolations(this, sharedStateOptions);
		this.submissionState = createParentNodeSubmissionState(this);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}
}
