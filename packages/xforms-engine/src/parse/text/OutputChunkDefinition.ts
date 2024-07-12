import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import { TextChunkDefinition } from './abstract/TextChunkDefinition.ts';
import type { AnyTextRangeDefinition } from './abstract/TextRangeDefinition.ts';

interface OutputElement extends KnownAttributeLocalNamedElement<'output', 'value'> {}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class OutputChunkDefinition extends TextChunkDefinition<'output'> {
	static from(context: AnyTextRangeDefinition, element: Element): OutputChunkDefinition | null {
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
