import type { XFormsXPathEvaluator } from '@odk/xpath';
import type { TextElementPart } from './TextElementPart.ts';

// TODO: this will have significant overlap with `BindExpression`
export class TextElementExpressionPart implements TextElementPart {
	get dependencyExpressions(): readonly string[] {
		throw new Error('Not implemented');
	}

	constructor(protected readonly expression: string) {}

	evaluate(evaluator: XFormsXPathEvaluator, contextNode: Node): string {
		return evaluator.evaluateString(this.expression, { contextNode });
	}
}
