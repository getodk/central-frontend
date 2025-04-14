import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createSignal } from 'solid-js';
import type { FormInstanceInitializationMode } from '../client/form/FormInstance.ts';
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
import type { XFormsXPathDocument } from '../integration/xpath/adapter/XFormsXPathNode.ts';
import { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
import type { StaticDocument } from '../integration/xpath/static-dom/StaticDocument.ts';
import { createPrimaryInstanceState } from '../lib/client-reactivity/instance-state/createPrimaryInstanceState.ts';
import { prepareInstancePayload } from '../lib/client-reactivity/instance-state/prepareInstancePayload.ts';
import { createChildrenState } from '../lib/reactivity/createChildrenState.ts';
import { createTranslationState } from '../lib/reactivity/createTranslationState.ts';
import type { MaterializedChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import { materializeCurrentStateChildren } from '../lib/reactivity/materializeCurrentStateChildren.ts';
import type { CurrentState } from '../lib/reactivity/node-state/createCurrentState.ts';
import type { EngineState } from '../lib/reactivity/node-state/createEngineState.ts';
import type { SharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import { createSharedNodeState } from '../lib/reactivity/node-state/createSharedNodeState.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import type { SimpleAtomicStateSetter } from '../lib/reactivity/types.ts';
import type { BodyClassList } from '../parse/body/BodyDefinition.ts';
import type { ModelDefinition } from '../parse/model/ModelDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import type { SecondaryInstancesDefinition } from '../parse/model/SecondaryInstance/SecondaryInstancesDefinition.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import { InstanceAttachmentsState } from './attachments/InstanceAttachmentsState.ts';
import type { InitialInstanceState } from './input/InitialInstanceState.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import type { PrimaryInstanceDocument } from './internal-api/PrimaryInstanceDocument.ts';
import type { ClientReactiveSerializableInstance } from './internal-api/serialization/ClientReactiveSerializableInstance.ts';
import type { TranslationContext } from './internal-api/TranslationContext.ts';
import { Root } from './Root.ts';

/**
 * As specified by {@link | XPath 1.0}:
 *
 * > A `/` by itself selects the root node of the document containing the
 * > context node.
 *
 * Important note: "root node" here references the same semantics currently
 * represented by `@getodk/xpath` as {@link XPathDocument}. It is an infortunate
 * historical mistake that our internal representation of a primary instance has
 * conflated the same "root" term to represent the "document element" with the
 * same semantic name.
 *
 * {@link PrimaryInstance} exists specifically to provide XPath document
 * semantics. At time of writing, it is expected that every XPath evaluation
 * will be performed with a context node either:
 *
 * - somewhere in this primary instance document's hierarchy; or
 * - in a related subtree where the primary instance document is still
 *   semantically represented as the context root node
 */
const PRIMARY_INSTANCE_REFERENCE = '/';

interface PrimaryInstanceStateSpec {
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

interface PrimaryInstanceStateInputByMode {
	readonly create: null;
	readonly edit: InitialInstanceState;
	readonly restore: InitialInstanceState;
}

export type PrimaryInstanceInitialState<Mode extends FormInstanceInitializationMode> =
	PrimaryInstanceStateInputByMode[Mode];

export interface BasePrimaryInstanceOptions {
	readonly scope: ReactiveScope;
	readonly model: ModelDefinition;
	readonly secondaryInstances: SecondaryInstancesDefinition;
}

export interface ModelessPrimaryInstanceOptions extends BasePrimaryInstanceOptions {
	readonly config: InstanceConfig;
}

export interface PrimaryInstanceOptions<Mode extends FormInstanceInitializationMode>
	extends ModelessPrimaryInstanceOptions {
	readonly mode: Mode;
	readonly initialState: PrimaryInstanceInitialState<Mode>;
}

export class PrimaryInstance<
		Mode extends FormInstanceInitializationMode = FormInstanceInitializationMode,
	>
	extends InstanceNode<RootDefinition, PrimaryInstanceStateSpec, null, Root>
	implements
		PrimaryInstanceDocument,
		XFormsXPathDocument,
		TranslationContext,
		EvaluationContext,
		ClientReactiveSerializableInstance
{
	readonly initializationMode: FormInstanceInitializationMode;
	readonly model: ModelDefinition;
	readonly attachments: InstanceAttachmentsState;

	// InstanceNode
	protected readonly state: SharedNodeState<PrimaryInstanceStateSpec>;
	protected readonly engineState: EngineState<PrimaryInstanceStateSpec>;

	override readonly instanceNode: StaticDocument;
	readonly getChildren: Accessor<readonly Root[]>;
	readonly hasReadonlyAncestor = () => false;
	readonly isReadonly = () => false;
	readonly hasNonRelevantAncestor = () => false;
	readonly isRelevant = () => true;

	// TranslationContext (support)
	private readonly setActiveLanguage: SimpleAtomicStateSetter<FormLanguage>;

	// XFormsXPathDocument
	readonly [XPathNodeKindKey] = 'document';

	// PrimaryInstanceDocument, ClientReactiveSerializableInstance
	readonly nodeType = 'primary-instance';
	readonly appearances = null;
	readonly nodeOptions = null;
	readonly classes: BodyClassList;
	readonly root: Root;
	readonly currentState: MaterializedChildren<CurrentState<PrimaryInstanceStateSpec>, Root>;
	readonly validationState: AncestorNodeValidationState;
	readonly instanceState: InstanceState;
	readonly languages: FormLanguages;

	// TranslationContext (+ EvaluationContext)
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	// EvaluationContext
	readonly isAttached: Accessor<boolean>;
	readonly evaluator: EngineXPathEvaluator;
	override readonly contextNode = this;

	constructor(options: PrimaryInstanceOptions<Mode>) {
		const { mode, initialState, scope, model, secondaryInstances, config } = options;
		const { instance: modelInstance } = model;
		const activeInstance = initialState?.document ?? modelInstance;
		const definition = model.getRootDefinition(activeInstance);

		super(config, null, activeInstance, definition, {
			scope,
			computeReference: () => PRIMARY_INSTANCE_REFERENCE,
		});

		this.initializationMode = mode;
		this.model = model;
		this.attachments = new InstanceAttachmentsState(initialState?.attachments);
		this.instanceNode = activeInstance;

		const [isAttached, setIsAttached] = createSignal(false);

		this.isAttached = isAttached;

		const evaluator = new EngineXPathEvaluator({
			rootNode: this,
			itextTranslationsByLanguage: model.itextTranslations,
			secondaryInstancesById: secondaryInstances,
		});

		const { languages, getActiveLanguage, setActiveLanguage } = createTranslationState(
			scope,
			evaluator
		);

		this.languages = languages;
		this.getActiveLanguage = getActiveLanguage;
		this.setActiveLanguage = setActiveLanguage;

		this.evaluator = evaluator;
		this.classes = definition.classes;

		const childrenState = createChildrenState<this, Root>(this);

		this.getChildren = childrenState.getChildren;

		const stateSpec: PrimaryInstanceStateSpec = {
			activeLanguage: getActiveLanguage,
			reference: PRIMARY_INSTANCE_REFERENCE,
			label: null,
			hint: null,
			readonly: false,
			relevant: true,
			required: false,
			valueOptions: null,
			value: null,
			children: childrenState.childIds,
		};

		const state = createSharedNodeState(scope, stateSpec, config);

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = materializeCurrentStateChildren(scope, state.currentState, childrenState);

		const root = new Root(this);

		this.root = root;

		this.validationState = {
			get violations() {
				return root.validationState.violations;
			},
		};
		this.instanceState = createPrimaryInstanceState(this);

		childrenState.setChildren([root]);
		setIsAttached(true);
	}

	// PrimaryInstanceDocument
	/**
	 * @todo Note that this method's signature is intentionally derived from
	 * {@link RootNode.setLanguage}, but its return type differs! The design
	 * intent of returning {@link RootNode} from all of the client-facing state
	 * setter methods has proven… interesting philosophically. But nothing
	 * downstream has availed itself of that philosophy, and otherwise it's not
	 * particularly pragmatic or ergonomic (internally or for clients alike).
	 *
	 * Since this class is (currently) engine-internal, this seems like an
	 * excellent place to start a discussion around what we want longer term for
	 * state setter signatures in _client-facing_ APIs. As a first pass, it seems
	 * reasonable to borrow the idiomatic convention of returning the effective
	 * value assigned by the setter.
	 *
	 * @see
	 * {@link https://github.com/getodk/web-forms/issues/45#issuecomment-1967932261 | Initial read interface design between engine and UI - design summary comment}
	 * (and some of the comments leading up to it) for background on the
	 * philosophical reasoning behind the existing signature convention.
	 */
	setLanguage(language: FormLanguage): FormLanguage {
		const availableFormLanguage = this.languages.find(
			(formLanguage): formLanguage is FormLanguage => {
				return (
					formLanguage.isSyntheticDefault == null && formLanguage.language === language.language
				);
			}
		);

		if (availableFormLanguage == null) {
			throw new Error(`Language "${language.language}" not available`);
		}

		this.evaluator.setActiveLanguage(availableFormLanguage.language);

		return this.setActiveLanguage(availableFormLanguage);
	}

	// PrimaryInstanceDocument
	prepareInstancePayload<PayloadType extends InstancePayloadType = 'monolithic'>(
		options?: InstancePayloadOptions<PayloadType>
	): Promise<InstancePayload<PayloadType>> {
		const result = prepareInstancePayload(this, {
			payloadType: (options?.payloadType ?? 'monolithic') as PayloadType,
			maxSize: options?.maxSize ?? Infinity,
		});

		return Promise.resolve(result);
	}
}
