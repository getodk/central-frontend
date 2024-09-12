import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { AnyTextRangeDefinition } from '../../text/abstract/TextRangeDefinition.ts';
import { TextChunkExpression } from './TextChunkExpression.ts';

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class TextOutputExpression extends TextChunkExpression<'output'> {
	static from(context: AnyTextRangeDefinition, element: Element): TextOutputExpression | null {
		if (isOutputElement(element)) {
			return new this(context, element);
		}

		return null;
	}

	readonly source = 'output';

	private constructor(context: AnyTextRangeDefinition, element: OutputElement) {
		super(context, element.getAttribute('value'));
	}
}
