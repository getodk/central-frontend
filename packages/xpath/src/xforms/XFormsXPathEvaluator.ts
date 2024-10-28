import type { UnwrapAdapterNode } from '../adapter/interface/XPathCustomUnwrappableNode.ts';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type {
	AdapterDocument,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { EvaluationContext } from '../context/EvaluationContext.ts';
import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import { Evaluator } from '../evaluator/Evaluator.ts';
import { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import { enk } from '../functions/enketo/index.ts';
import { fn } from '../functions/fn/index.ts';
import { jr } from '../functions/javarosa/index.ts';
import { xf } from '../functions/xforms/index.ts';
import type {
	XFormsItextTranslationLanguage,
	XFormsItextTranslationMap,
	XFormsItextTranslationsState,
} from './XFormsItextTranslations.ts';
import { XFormsItextTranslations } from './XFormsItextTranslations.ts';
import type {
	XFormsSecondaryInstanceElement,
	XFormsSecondaryInstanceMap,
} from './XFormsSecondaryInstances.ts';

// Note: order of `FunctionLibrary` items matters! `xf` overrides `fn`, and
// `enk` overrides `xf`.
//
// TODO: break out yet another Enketo entry?
const functions = new FunctionLibraryCollection([enk, xf, fn, jr], {
	defaultNamespaceURIs: [enk.namespaceURI, xf.namespaceURI, fn.namespaceURI],
});

/**
 * @todo We accept an arbitrary parent node specifically for legacy WHATWG DOM
 * integration, which we will no longer be using _except in test_. We should
 * consider narrowing this type to {@link AdapterDocument} for any other usage.
 */
// prettier-ignore
export type XFormsXPathRootNode<T extends XPathNode> =
	| AdapterParentNode<T>
	| UnwrapAdapterNode<AdapterParentNode<T>>;

export interface XFormsXPathEvaluatorOptions<T extends XPathNode> extends EvaluatorOptions<T> {
	readonly rootNode: XFormsXPathRootNode<T>;
	readonly itextTranslationsByLanguage: XFormsItextTranslationMap<T>;
	readonly secondaryInstancesById: XFormsSecondaryInstanceMap<T>;
}

/**
 * **!!! WEIRD TYPESCRIPT SHENANIGAN !!!**
 *
 *  This is meant to be an interface. Use of
 * `declare class` syntax is what allows us to provide internal access to:
 *
 * - {@link itextTranslations}, which is **package** private.
 */
declare class InternalXFormsXPathEvaluator<T extends XPathNode> extends XFormsXPathEvaluator<T> {
	readonly itextTranslations: XFormsItextTranslations<T>;
}

interface InternalXFormsXPathEvaluatorContext<T extends XPathNode> extends EvaluationContext {
	readonly evaluator: InternalXFormsXPathEvaluator<T>;
}

type AssertInternalXFormsXPathEvaluatorContext = <T extends XPathNode>(
	context: EvaluationContext
) => asserts context is InternalXFormsXPathEvaluatorContext<T>;

const assertInternalXFormsXPathEvaluatorContext: AssertInternalXFormsXPathEvaluatorContext = (
	context
) => {
	const { evaluator } = context;

	if (evaluator instanceof XFormsXPathEvaluator) {
		return;
	}

	throw new Error('Expected evaluation context initiated by XFormsXPathEvaluator');
};

export class XFormsXPathEvaluator<T extends XPathNode>
	extends Evaluator<T>
	implements XFormsItextTranslationsState
{
	static getSecondaryInstance<T extends XPathNode>(
		context: EvaluationContext,
		id: string
	): XFormsSecondaryInstanceElement<T> | null {
		assertInternalXFormsXPathEvaluatorContext(context);

		return context.evaluator.secondaryInstancesById.get(id) ?? null;
	}

	static getDefaultTranslationText(context: EvaluationContext, itextID: string): string {
		assertInternalXFormsXPathEvaluatorContext(context);

		return context.evaluator.itextTranslations.getDefaultTranslationText(itextID);
	}

	override readonly rootNode: AdapterParentNode<T>;

	/**
	 * @package
	 * @see {@link InternalXFormsXPathEvaluator}
	 */
	protected readonly itextTranslations: XFormsItextTranslationsState;

	/**
	 * @package
	 * @see {@link InternalXFormsXPathEvaluator}
	 */
	protected readonly secondaryInstancesById: XFormsSecondaryInstanceMap<T>;

	constructor(options: XFormsXPathEvaluatorOptions<T>) {
		super({
			functions,
			...options,
		});

		this.secondaryInstancesById = options.secondaryInstancesById;
		this.rootNode = options.rootNode as AdapterParentNode<T>;
		this.itextTranslations = new XFormsItextTranslations(
			this.domProvider,
			options.itextTranslationsByLanguage
		);
	}

	getLanguages(): readonly XFormsItextTranslationLanguage[] {
		return this.itextTranslations.getLanguages();
	}

	getActiveLanguage(): XFormsItextTranslationLanguage | null {
		return this.itextTranslations.getActiveLanguage();
	}

	setActiveLanguage(
		language: XFormsItextTranslationLanguage | null
	): XFormsItextTranslationLanguage | null {
		return this.itextTranslations.setActiveLanguage(language);
	}

	getSecondaryInstance(id: string) {
		return this.secondaryInstancesById.get(id);
	}
}
