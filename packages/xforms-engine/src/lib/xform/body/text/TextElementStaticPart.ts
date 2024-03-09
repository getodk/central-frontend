import type { AnyTextElementDefinition } from './TextElementDefinition.ts';
import { TextElementPart } from './TextElementPart.ts';

const toStaticXPathExpression = (staticTextValue: string): string => {
	const quote = staticTextValue.includes('"') ? "'" : '"';

	if (staticTextValue.includes(quote)) {
		throw new Error('todo concat()');
	}

	return `${quote}${staticTextValue}${quote}`;
};

export class TextElementStaticPart extends TextElementPart<'static'> {
	override readonly stringValue: string;

	constructor(context: AnyTextElementDefinition, node: Text) {
		const stringValue = node.data;
		const expression = toStaticXPathExpression(stringValue);

		super('static', context, expression);

		this.stringValue = stringValue;
	}
}
