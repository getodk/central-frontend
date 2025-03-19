import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { FormNodeID } from '../client/identity.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { InstancePayload } from '../client/serialization/InstancePayload.ts';
import type {
	InstancePayloadOptions,
	InstancePayloadType,
} from '../client/serialization/InstancePayloadOptions.ts';
import type { InstanceState } from '../client/serialization/InstanceState.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import type { XFormsXPathElement } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { createRootInstanceState } from '../lib/client-reactivity/instance-state/createRootInstanceState.ts';
import type { ChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createAggregatedViolations } from '../lib/reactivity/validation/createAggregatedViolations.ts';
import type { BodyClassList } from '../parse/body/BodyDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import { DescendantNode } from './abstract/DescendantNode.ts';
import { buildChildren } from './children/buildChildren.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSerializableParentNode } from './internal-api/serialization/ClientReactiveSerializableParentNode.ts';
import type { TranslationContext } from './internal-api/TranslationContext.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';

interface RootStateSpec {
	readonly reference: Accessor<string>;
	readonly readonly: Accessor<boolean>;
	readonly relevant: Accessor<boolean>;
	readonly required: Accessor<boolean>;
	readonly label: null;
	readonly hint: null;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;

	// Root-specific
	readonly activeLanguage: Accessor<ActiveLanguage>;
}

export class Root
	extends DescendantNode<RootDefinition, RootStateSpec, PrimaryInstance, GeneralChildNode>
	implements
		RootNode,
		XFormsXPathElement,
		EvaluationContext,
		TranslationContext,
		ClientReactiveSerializableParentNode<GeneralChildNode>
{
	private readonly childrenState: ChildrenState<GeneralChildNode>;

	// XFormsXPathElement
	override readonly [XPathNodeKindKey] = 'element';

	// DescendantNode
	protected readonly state: SharedNodeState<RootStateSpec>;
	protected readonly engineState: EngineState<RootStateSpec>;

	override readonly hasReadonlyAncestor = () => false;
	override readonly isSelfReadonly = () => false;
	override readonly isReadonly = () => false;
	override readonly hasNonRelevantAncestor = () => false;
	override readonly isSelfRelevant = () => true;
	override readonly isRelevant = () => true;
	override readonly isRequired = () => false;

	// RootNode
	readonly nodeType = 'root';
	readonly appearances = null;
	readonly nodeOptions = null;
	readonly classes: BodyClassList;
	readonly currentState: MaterializedChildren<CurrentState<RootStateSpec>, GeneralChildNode>;
	readonly validationState: AncestorNodeValidationState;
	readonly instanceState: InstanceState;
	readonly languages: FormLanguages;

	constructor(parent: PrimaryInstance) {
		const { definition, instanceNode: instance } = parent;
		const instanceNode = instance.root;
		const { nodeset: reference } = definition;
		const computeReference: Accessor<string> = () => reference;

		super(parent, instanceNode, definition, {
			computeReference,
		});

		this.classes = parent.classes;

		const childrenState = createChildrenState<Root, GeneralChildNode>(this);

		this.childrenState = childrenState;
		this.languages = parent.languages;

		const state = createSharedNodeState(
			this.scope,
			{
				activeLanguage: parent.getActiveLanguage,
				reference: computeReference,
				label: null,
				hint: null,
				readonly: () => false,
				relevant: () => true,
				required: () => false,
				valueOptions: null,
				value: null,
				children: childrenState.childIds,
			},
			this.instanceConfig
		);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(
			this.scope,
			state.currentState,
			childrenState
		);

		childrenState.setChildren(buildChildren(this));
		this.validationState = createAggregatedViolations(this, this.instanceConfig);
		this.instanceState = createRootInstanceState(this);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}

	// RootNode
	setLanguage(language: FormLanguage): Root {
		this.rootDocument.setLanguage(language);

		return this;
	}

	prepareInstancePayload<PayloadType extends InstancePayloadType = 'monolithic'>(
		options?: InstancePayloadOptions<PayloadType>
	): Promise<InstancePayload<PayloadType>> {
		return this.rootDocument.prepareInstancePayload(options);
	}
}
