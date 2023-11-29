import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import { Evaluator } from '../evaluator/Evaluator.ts';
import { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import { enk } from '../functions/enketo/index.ts';
import { fn } from '../functions/fn/index.ts';
import { jr } from '../functions/javarosa/index.ts';
import { xf } from '../functions/xforms/index.ts';
import type { AnyParentNode } from '../lib/dom/types.ts';
import type { BaseParser } from '../static/grammar/ExpressionParser.ts';
import { XFormsItextTranslations } from './XFormsItextTranslations.ts';

// Note: order of `FunctionLibrary` items matters! `xf` overrides `fn`, and
// `enk` overrides `xf`.
//
// TODO: break out yet another Enketo entry?
const functions = new FunctionLibraryCollection([enk, xf, fn, jr], {
	defaultNamespaceURIs: [enk.namespaceURI, xf.namespaceURI, fn.namespaceURI],
});

interface XFormsXPathEvaluatorOptions extends EvaluatorOptions {
	readonly rootNode: AnyParentNode;
}

export class XFormsXPathEvaluator extends Evaluator {
	override readonly rootNode: AnyParentNode;

	readonly translations: XFormsItextTranslations;

	constructor(parser: BaseParser, options: XFormsXPathEvaluatorOptions) {
		super(parser, {
			functions,
			...options,
		});

		this.rootNode = options.rootNode;
		this.translations = new XFormsItextTranslations(this);
	}
}
