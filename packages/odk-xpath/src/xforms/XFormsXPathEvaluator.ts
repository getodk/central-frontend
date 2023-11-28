import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import { Evaluator } from '../evaluator/Evaluator.ts';
import { FN_NAMESPACE_URI } from '../evaluator/NamespaceResolver.ts';
import { FunctionLibrary } from '../evaluator/functions/FunctionLibrary.ts';
import * as enketoImplementations from '../functions/enketo/index.ts';
import * as fnImplementations from '../functions/fn/index.ts';
import * as xformsImplementations from '../functions/xforms/index.ts';
import type { AnyParentNode } from '../lib/dom/types.ts';
import type { BaseParser } from '../static/grammar/ExpressionParser.ts';

const functionLibrary = new FunctionLibrary(FN_NAMESPACE_URI, [
	...Object.entries(fnImplementations),
	...Object.entries(xformsImplementations),
	...Object.entries(enketoImplementations),
]);

interface XFormsXPathEvaluatorOptions extends EvaluatorOptions {
	readonly rootNode: AnyParentNode;
}

export class XFormsXPathEvaluator extends Evaluator {
	override readonly rootNode: AnyParentNode;

	constructor(parser: BaseParser, options: XFormsXPathEvaluatorOptions) {
		super(parser, {
			...options,
			functionLibrary,
		});

		this.rootNode = options.rootNode;
	}
}
