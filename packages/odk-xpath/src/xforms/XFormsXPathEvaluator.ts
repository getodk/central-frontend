import type { EvaluatorOptions } from '../evaluator/Evaluator.ts';
import { Evaluator } from '../evaluator/Evaluator.ts';
import type { AnyParentNode } from '../lib/dom/types.ts';
import type { BaseParser } from '../static/grammar/ExpressionParser.ts';

interface XFormsXPathEvaluatorOptions extends EvaluatorOptions {
	readonly rootNode: AnyParentNode;
}

export class XFormsXPathEvaluator extends Evaluator {
	override readonly rootNode: AnyParentNode;

	constructor(parser: BaseParser, options: XFormsXPathEvaluatorOptions) {
		super(parser, options);

		this.rootNode = options.rootNode;
	}
}
