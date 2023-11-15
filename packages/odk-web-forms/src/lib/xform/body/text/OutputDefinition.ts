import type { XFormXPathEvaluator } from '../../../xpath/XFormXPathEvaluator.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { BaseTextElementDefinition } from './BaseTextElementDefinition.ts';
import type { TextElementPart } from './TextElementPart.ts';

interface OutputElement extends Element {
	readonly localName: 'output';

	getAttribute(name: 'value'): string;
	getAttribute(name: string): string | null;
}

export const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class OutputDefintion
	extends BaseTextElementDefinition<'output'>
	implements TextElementPart
{
	readonly type = 'output';

	get dependencyExpressions(): readonly string[] {
		throw new Error('Not implemented');
	}

	readonly expression: string;
	readonly parts: readonly [this];

	constructor(form: XFormDefinition, element: OutputElement) {
		super(form, element);

		this.expression = element.getAttribute('value');
		this.parts = [this];
	}

	evaluate(evaluator: XFormXPathEvaluator, contextNode: Node): string {
		return evaluator.evaluateString(this.expression, { contextNode });
	}

	override toJSON() {
		const { form, parts, ...rest } = this;

		return {
			...rest,
			parts: ['OutputDefinition (self)'],
		};
	}
}
