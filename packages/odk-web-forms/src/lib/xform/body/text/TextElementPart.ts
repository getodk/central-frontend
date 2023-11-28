import type { XFormsXPathEvaluator } from '@odk/xpath';

export interface TextElementPart {
	readonly dependencyExpressions: readonly string[];

	evaluate(evaluator: XFormsXPathEvaluator, contextNode: Node): string;
}
