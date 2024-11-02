import type { Accessor } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { FormNodeID } from '../client/identity.ts';
import type { RootNode } from '../client/RootNode.ts';
import type { SubmissionDefinition } from '../client/submission/SubmissionDefinition.ts';
import type {
	SubmissionChunkedType,
	SubmissionOptions,
} from '../client/submission/SubmissionOptions.ts';
import type { SubmissionResult } from '../client/submission/SubmissionResult.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
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
import type { BodyClassList } from '../parse/body/BodyDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import { buildChildren } from './children.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { ClientReactiveSubmittableParentNode } from './internal-api/submission/ClientReactiveSubmittableParentNode.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
import type { TranslationContext } from './internal-api/TranslationContext.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';

interface RootStateSpec {
	readonly reference: string;
	readonly readonly: boolean;
	readonly relevant: boolean;
	readonly required: boolean;
	readonly label: null;
	readonly hint: null;
	readonly children: Accessor<readonly FormNodeID[]>;
	readonly valueOptions: null;
	readonly value: null;

	// Root-specific
	readonly activeLanguage: Accessor<ActiveLanguage>;
}

export class Root
	extends InstanceNode<RootDefinition, RootStateSpec, GeneralChildNode>
	implements
		RootNode,
		EvaluationContext,
		SubscribableDependency,
		TranslationContext,
		ClientReactiveSubmittableParentNode<GeneralChildNode>
{
	/** @todo this won't stay private long */
	private readonly rootDocument: PrimaryInstance;

	private readonly childrenState: ChildrenState<GeneralChildNode>;

	// InstanceNode
	readonly hasReadonlyAncestor = () => false;
	readonly isReadonly = () => false;
	readonly hasNonRelevantAncestor = () => false;
	readonly isRelevant = () => true;
	protected readonly state: SharedNodeState<RootStateSpec>;
	protected readonly engineState: EngineState<RootStateSpec>;

	// RootNode
	readonly nodeType = 'root';
	readonly appearances = null;
	readonly classes: BodyClassList;
	readonly currentState: MaterializedChildren<CurrentState<RootStateSpec>, GeneralChildNode>;
	readonly validationState: AncestorNodeValidationState;
	readonly submissionState: SubmissionState;

	// ClientReactiveSubmittableInstance
	get submissionDefinition(): SubmissionDefinition {
		return this.definition.submission;
	}

	// BaseNode
	readonly root = this;

	// EvaluationContext
	readonly evaluator: EngineXPathEvaluator;

	readonly contextNode: Element;

	// RootNode
	override readonly parent = null;

	readonly languages: FormLanguages;

	// TranslationContext
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(parent: PrimaryInstance) {
		const { definition, engineConfig, evaluator } = parent;
		const reference = definition.nodeset;

		super(engineConfig, null, definition, {
			computeReference: () => reference,
		});

		this.rootDocument = parent;

		this.classes = definition.classes;

		const childrenState = createChildrenState<Root, GeneralChildNode>(this);

		this.childrenState = childrenState;

		this.languages = parent.languages;
		this.getActiveLanguage = parent.getActiveLanguage;

		const sharedStateOptions = {
			clientStateFactory: this.engineConfig.stateFactory,
		};

		const state = createSharedNodeState(
			this.scope,
			{
				activeLanguage: parent.getActiveLanguage,
				reference,
				label: null,
				hint: null,
				readonly: false,
				relevant: true,
				required: false,
				valueOptions: null,
				value: null,
				children: childrenState.childIds,
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

		this.evaluator = evaluator;
		this.contextNode = parent.contextNode.documentElement;

		childrenState.setChildren(buildChildren(this));
		this.validationState = createAggregatedViolations(this, sharedStateOptions);
		this.submissionState = createParentNodeSubmissionState(this);
	}

	getChildren(): readonly GeneralChildNode[] {
		return this.childrenState.getChildren();
	}

	// RootNode
	setLanguage(language: FormLanguage): Root {
		this.rootDocument.setLanguage(language);

		return this;
	}

	prepareSubmission<ChunkedType extends SubmissionChunkedType = 'monolithic'>(
		options?: SubmissionOptions<ChunkedType>
	): Promise<SubmissionResult<ChunkedType>> {
		return this.rootDocument.prepareSubmission(options);
	}

	// SubscribableDependency
	override subscribe(): void {
		super.subscribe();

		this.getActiveLanguage();
	}
}
