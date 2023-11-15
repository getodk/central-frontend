import type { XFormXPathEvaluator } from '../../../xpath/XFormXPathEvaluator';

export interface TextElementPart {
	readonly dependencyExpressions: readonly string[];

	evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): string;
}
