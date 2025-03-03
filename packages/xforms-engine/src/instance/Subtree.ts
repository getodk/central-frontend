import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { FormNodeID } from '../client/identity.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { SubtreeDefinition, SubtreeNode } from '../client/SubtreeNode.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createParentNodeSubmissionState } from '../lib/client-reactivity/submission/createParentNodeSubmissionState.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createAggregatedViolations } from '../lib/reactivity/validation/createAggregatedViolations.ts';
import type { DescendantNodeSharedStateSpec } from './abstract/DescendantNode.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableParentNode } from './internal-api/submission/ClientReactiveSubmittableParentNode.ts';

interface SubtreeStateSpec extends DescendantNodeSharedStateSpec {
	readonly label: null;
	readonly hint: null;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;
}

export class Subtree
	extends DescendantNode<SubtreeDefinition, SubtreeStateSpec, GeneralParentNode, GeneralChildNode>
	implements
		SubtreeNode,
		XFormsXPathElement,
		EvaluationContext,
		ClientReactiveSubmittableParentNode<GeneralChildNode>
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;

	override readonly [XPathNodeKindKey] = 'element';

	// InstanceNode
	protected readonly state: SharedNodeState<SubtreeStateSpec>;
	protected readonly engineState: EngineState<SubtreeStateSpec>;

	// SubtreeNode
	readonly nodeType = 'subtree';
	readonly appearances = null;
	readonly nodeOptions = null;
	readonly currentState: MaterializedChildren<CurrentState<SubtreeStateSpec>, GeneralChildNode>;
	readonly validationState: AncestorNodeValidationState;
	readonly submissionState: SubmissionState;

	constructor(parent: GeneralParentNode, definition: SubtreeDefinition) {
		super(parent, definition);

		const childrenState = createChildrenState<Subtree, GeneralChildNode>(this);

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

				label: null,
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

		childrenState.setChildren(buildChildren(this));
		this.validationState = createAggregatedViolations(this, sharedStateOptions);
		this.submissionState = createParentNodeSubmissionState(this);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}
}
