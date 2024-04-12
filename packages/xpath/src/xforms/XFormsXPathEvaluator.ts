import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import { Evaluator } from '../evaluator/Evaluator.ts';
import { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import { enk } from '../functions/enketo/index.ts';
import { fn } from '../functions/fn/index.ts';
import { jr } from '../functions/javarosa/index.ts';
import { xf } from '../functions/xforms/index.ts';
import type { AnyParentNode } from '../lib/dom/types.ts';
import { XFormsItextTranslations } from './XFormsItextTranslations.ts';

// Note: order of `FunctionLibrary` items matters! `xf` overrides `fn`, and
// `enk` overrides `xf`.
//
// TODO: break out yet another Enketo entry?
const functions = new FunctionLibraryCollection([enk, xf, fn, jr], {
	defaultNamespaceURIs: [enk.namespaceURI, xf.namespaceURI, fn.namespaceURI],
});

export interface ModelElement extends Element {
	readonly localName: 'model';
}

interface XFormsXPathEvaluatorOptions extends EvaluatorOptions {
	readonly rootNode: AnyParentNode;
}

export class XFormsXPathEvaluator extends Evaluator {
	override readonly rootNode: AnyParentNode;
	override readonly rootNodeDocument: XMLDocument;

	readonly modelElement: ModelElement | null;

	readonly translations: XFormsItextTranslations;

	constructor(options: XFormsXPathEvaluatorOptions) {
		super({
			functions,
			...options,
		});

		const { rootNode } = options;

		const rootNodeDocument: XMLDocument = rootNode.ownerDocument ?? rootNode;

		/**
		 * TODO: as noted in {@link XFormsItextTranslations}, this breaks out of
		 * the {@link rootNode} sandbox.
		 */
		this.modelElement = this.evaluateNode<ModelElement>('./h:html/h:head/xf:model', {
			contextNode: rootNodeDocument,
		});

		this.rootNode = options.rootNode;
		this.rootNodeDocument = rootNodeDocument;
		this.translations = new XFormsItextTranslations(this);
	}
}
