import type { XPathDocument } from '@getodk/xpath';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode } from '../client/RootNode.ts';
import type {
	SubmissionChunkedType,
	SubmissionOptions,
} from '../client/submission/SubmissionOptions.ts';
import type { SubmissionResult } from '../client/submission/SubmissionResult.ts';
import type { SubmissionState } from '../client/submission/SubmissionState.ts';
import type { AncestorNodeValidationState } from '../client/validation.ts';
import { EngineXPathEvaluator } from '../integration/xpath/EngineXPathEvaluator.ts';
import { createInstanceSubmissionState } from '../lib/client-reactivity/submission/createInstanceSubmissionState.ts';
import { prepareSubmission } from '../lib/client-reactivity/submission/prepareSubmission.ts';
import { createTranslationState } from '../lib/reactivity/createTranslationState.ts';
import type { ReactiveScope } from '../lib/reactivity/scope.ts';
import type { SimpleAtomicStateSetter } from '../lib/reactivity/types.ts';
import type { ModelDefinition } from '../parse/model/ModelDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import type { ClientReactiveSubmittableInstance } from './internal-api/submission/ClientReactiveSubmittableInstance.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';
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

interface PrimaryInstanceCurrentState {
	readonly relevant: boolean;
	readonly children: readonly Root[];
}

export class PrimaryInstance
	implements
		XPathDocument,
		TranslationContext,
		EvaluationContext,
		ClientReactiveSubmittableInstance
{
	// TranslationContext (support)
	private readonly setActiveLanguage: SimpleAtomicStateSetter<FormLanguage>;

	// XPathDocument
	readonly [XPathNodeKindKey] = 'document';

	// (Now: ClientReactiveSubmittableInstance, RootNode support; soon: ClientReactiveSubmittableInstance, PrimaryInstanceDocument)
	readonly definition: RootDefinition;
	readonly root: Root;
	readonly parent = null;
	readonly currentState: PrimaryInstanceCurrentState;
	readonly validationState: AncestorNodeValidationState;
	readonly submissionState: SubmissionState;
	readonly languages: FormLanguages;

	// TranslationContext (+ EvaluationContext)
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	// EvaluationContext
	readonly contextReference = () => PRIMARY_INSTANCE_REFERENCE;
	readonly evaluator: EngineXPathEvaluator;
	readonly contextNode: Document;

	constructor(
		readonly scope: ReactiveScope, // EvaluationContext
		model: ModelDefinition,
		readonly engineConfig: InstanceConfig // Consistency with InstanceNode
	) {
		const { root: definition, form } = model;
		const { xformDOM } = form;
		const { namespaceURI, nodeName } = xformDOM.primaryInstanceRoot;
		const rootNode: Document = xformDOM.xformDocument.implementation.createDocument(
			namespaceURI,
			nodeName
		);

		const evaluator = new EngineXPathEvaluator({
			rootNode,
			itextTranslationsByLanguage: model.itextTranslations,
			secondaryInstancesById: model.secondaryInstances,
		});

		const { languages, getActiveLanguage, setActiveLanguage } = createTranslationState(
			scope,
			evaluator
		);

		this.languages = languages;
		this.getActiveLanguage = getActiveLanguage;
		this.setActiveLanguage = setActiveLanguage;

		this.definition = definition;
		this.evaluator = evaluator;
		this.engineConfig = engineConfig;
		this.contextNode = rootNode;

		const children: Root[] = [];

		this.currentState = {
			relevant: true,
			children,
		};

		const root = new Root(this);

		children.push(root);
		this.root = root;

		this.validationState = {
			get violations() {
				return root.validationState.violations;
			},
		};
		this.submissionState = createInstanceSubmissionState(this);
	}

	// EvaluationContext
	/** @todo remove */
	getSubscribableDependenciesByReference(reference: string): readonly SubscribableDependency[] {
		return this.root.getSubscribableDependenciesByReference(reference);
	}

	// (Now: RootNode support; soon: PrimaryInstanceDocument)
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

	// ClientReactiveSubmittableInstance
	prepareSubmission<ChunkedType extends SubmissionChunkedType = 'monolithic'>(
		options?: SubmissionOptions<ChunkedType>
	): Promise<SubmissionResult<ChunkedType>> {
		const result = prepareSubmission(this, {
			chunked: (options?.chunked ?? 'monolithic') as ChunkedType,
			maxSize: options?.maxSize ?? Infinity,
		});

		return Promise.resolve(result);
	}
}
