import type { EvaluatorConvenienceMethodOptions } from '@odk/xpath';
import { Evaluator } from '@odk/xpath';
import { xpathParser } from './parser.ts';

export class XFormXPathEvaluator extends Evaluator {
	constructor(override readonly rootNode: Element | XMLDocument) {
		super(xpathParser, {
			rootNode,
		});
	}

	protected override getContextNode(options: EvaluatorConvenienceMethodOptions): Node {
		return options.contextNode ?? this.rootNode;
	}
}
