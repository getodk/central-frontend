import { XFORMS_NAMESPACE_URI, XHTML_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import type {
	DefaultDOMAdapterElement,
	DefaultDOMAdapterNode,
	DefaultDOMAdapterParentNode,
} from '../temp/dom-abstraction.ts';
import { DEFAULT_DOM_PROVIDER } from '../temp/dom-abstraction.ts';
import type { XFormsElementRepresentation } from './XFormsElementRepresentation.ts';
import type {
	XFormsItextTranslationElement,
	XFormsItextTranslationsState,
} from './XFormsItextTranslations.ts';
import type { XFormsSecondaryInstanceElement } from './XFormsSecondaryInstances.ts';
import type { XFormsXPathRootNode } from './XFormsXPathEvaluator.ts';
import { XFormsXPathEvaluator } from './XFormsXPathEvaluator.ts';

type LocalNamedElement<LocalName extends string> = XFormsElementRepresentation<
	DefaultDOMAdapterNode,
	LocalName
>;

type ModelElement = LocalNamedElement<'model'>;

interface NameQuery<
	LocalName extends string = string,
	NamespaceURI extends string | null = string | null,
> {
	readonly namespaceURI: NamespaceURI;
	readonly localName: LocalName;
}

const getQualifiedNamedChildElement = <LocalName extends string>(
	// This is a convenience for chaining
	parent: DefaultDOMAdapterParentNode,
	{ namespaceURI, localName }: NameQuery<LocalName>
): LocalNamedElement<LocalName> | null => {
	const [childElement] = DEFAULT_DOM_PROVIDER.getChildrenByLocalName(parent, localName);

	if (childElement == null || DEFAULT_DOM_PROVIDER.getNamespaceURI(childElement) !== namespaceURI) {
		return null;
	}

	return childElement as LocalNamedElement<LocalName>;
};

const getQualifiedNamedDescendant = <LocalName extends string>(
	initialParentNode: DefaultDOMAdapterParentNode,
	intermediateSteps: readonly NameQuery[],
	descendantQuery: NameQuery<LocalName>
): LocalNamedElement<LocalName> | null => {
	let currentParentNode: DefaultDOMAdapterParentNode = initialParentNode;

	for (const step of intermediateSteps) {
		const nextParentNode = getQualifiedNamedChildElement(currentParentNode, step);

		if (nextParentNode == null) {
			return null;
		}

		currentParentNode = nextParentNode;
	}

	return getQualifiedNamedChildElement(currentParentNode, descendantQuery);
};

const getModelElement = (rootNode: DefaultDOMAdapterParentNode): ModelElement | null => {
	const containingDocument = DEFAULT_DOM_PROVIDER.getContainingDocument(rootNode);

	return getQualifiedNamedDescendant(
		containingDocument,
		[
			{ namespaceURI: XHTML_NAMESPACE_URI, localName: 'html' },
			{ namespaceURI: XHTML_NAMESPACE_URI, localName: 'head' },
		],
		{
			namespaceURI: XFORMS_NAMESPACE_URI,
			localName: 'model',
		}
	);
};

type SecondaryInstanceElement = XFormsSecondaryInstanceElement<DefaultDOMAdapterNode>;

interface SecondaryInstancePredicateInput {
	readonly instanceElement: DefaultDOMAdapterElement;
	readonly id: string | null;
}

interface SecondaryInstancePredicatePass {
	readonly instanceElement: SecondaryInstanceElement;
	readonly id: string;
}

const isSecondaryInstance = (
	input: SecondaryInstancePredicateInput
): input is SecondaryInstancePredicatePass => {
	return input.id != null;
};

type SecondaryInstanceMap = ReadonlyMap<string, SecondaryInstanceElement>;

const noopSecondaryInstances: SecondaryInstanceMap = new Map();

const getInternalSecondaryInstancesById = (
	modelElement: ModelElement | null
): SecondaryInstanceMap => {
	if (modelElement == null) {
		return noopSecondaryInstances;
	}

	const [, ...instanceElements] = DEFAULT_DOM_PROVIDER.getChildrenByLocalName(
		modelElement,
		'instance'
	);

	const result = new Map<string, SecondaryInstanceElement>();

	for (const instanceElement of instanceElements) {
		const id = DEFAULT_DOM_PROVIDER.getLocalNamedAttributeValue(instanceElement, 'id');
		const item = {
			instanceElement,
			id,
		};

		if (isSecondaryInstance(item)) {
			if (result.has(item.id)) {
				throw new Error(`Duplicate secondary instance for id: ${id}`);
			}

			result.set(item.id, item.instanceElement);
		} else {
			throw new Error('Found non-primary <instance> without `id` attribute');
		}
	}

	return result;
};

type TranslationElement = XFormsItextTranslationElement<DefaultDOMAdapterNode>;

interface TranslationPredicateInput {
	readonly translationElement: DefaultDOMAdapterElement;
	readonly lang: string | null;
}

interface TranslationPredicatePass {
	readonly translationElement: TranslationElement;
	readonly lang: string;
}

const isTranslation = (input: TranslationPredicateInput): input is TranslationPredicatePass => {
	return input.translationElement.localName === 'translation' && input.lang != null;
};

type TranslationMap = ReadonlyMap<string, TranslationElement>;

const noopTranslations: TranslationMap = new Map();

const getTranslationsByLanguage = (modelElement: ModelElement | null): TranslationMap => {
	if (modelElement == null) {
		return noopTranslations;
	}

	const [itextRoot] = DEFAULT_DOM_PROVIDER.getChildrenByLocalName(modelElement, 'itext');

	if (itextRoot == null) {
		return noopTranslations;
	}

	const translationElements = DEFAULT_DOM_PROVIDER.getChildrenByLocalName(itextRoot, 'translation');

	const result = new Map<string, TranslationElement>();

	for (const translationElement of translationElements) {
		const lang = DEFAULT_DOM_PROVIDER.getLocalNamedAttributeValue(translationElement, 'lang');
		const item = {
			translationElement,
			lang,
		};

		if (isTranslation(item)) {
			if (result.has(item.lang)) {
				throw new Error(`Duplicate itext translation with language: ${lang}`);
			}

			result.set(item.lang, item.translationElement);
		} else {
			throw new Error('Found itext <translation> without `lang` attribute');
		}
	}

	return result;
};

interface DefaultXFormsXPathEvaluatorOptions extends EvaluatorOptions {
	readonly rootNode: XFormsXPathRootNode<DefaultDOMAdapterNode>;
}

/**
 * @deprecated
 *
 * This is a convenience wrapper for {@link XFormsXPathEvaluator}, providing
 * support for ODK XForms implementations whose primary instance state uses the
 * WHAT Working Group DOM (natively or through a browser compatibility layer),
 * as well as related ODK XForms-specified behavior involving WHATWG DOM access
 * outside of that primary instance state:
 *
 * - {@link https://getodk.github.io/xforms-spec/#secondary-instances---internal | secondary instances (internal)}
 * - {@link https://getodk.github.io/xforms-spec/#languages | itext translations}
 *
 * This wrapper is expected to serve two use cases:
 *
 * 1. **INDEFINITELY:** continue to support the extensive suite of tests which
 *    presently assume both usage of the WHATWG DOM, and presence of those
 *    ancillary subtrees within a single WHATWG DOM tree.
 *
 * 2. **TEMPORARILY:** continue to support the same for usage downstream from
 *    the `@getodk/xpath` package.
 *
 * We believe the latter is fully internal to ODK, in the
 * `@getodk/xforms-engine` package. That package will transition to use the
 * newer DOM adapter API, at which point:
 *
 * - we will stop exposing this class from the `@getodk/xpath` package
 * - we will make more explicit the remaining purpose of supporting test usage
 *
 * Longer term, as priorities permit, we may also migrate some or all existing
 * test suites to exercise the DOM adapter API more fully. In the
 * meantime, we expect the transition of `@getodk/xforms-engine` to serve as a
 * reference implementation, and its test suites to also serve the purpose of
 * more thoroughly exercising that aspect of this package.
 */
export class DefaultXFormsXPathEvaluator extends XFormsXPathEvaluator<DefaultDOMAdapterNode> {
	/**
	 * @todo Provides temporary backwards compatibilty **only** for usage
	 * downstream from `@getodk/xpath` package. To be removed when this class
	 * becomes test-only.
	 */
	get translations(): XFormsItextTranslationsState {
		return this.itextTranslations;
	}

	constructor(options: DefaultXFormsXPathEvaluatorOptions) {
		// prettier-ignore
		const rootNode = (
			options.rootNode ??
			null
		) satisfies XFormsXPathRootNode<DefaultDOMAdapterNode> as DefaultDOMAdapterParentNode;

		const modelElement = getModelElement(rootNode);
		const secondaryInstancesById = getInternalSecondaryInstancesById(modelElement);
		const itextTranslationsByLanguage = getTranslationsByLanguage(modelElement);

		super({
			...options,
			itextTranslationsByLanguage,
			secondaryInstancesById,
		});
	}
}
