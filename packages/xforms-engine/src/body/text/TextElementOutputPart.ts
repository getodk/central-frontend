import type { AnyTextElementDefinition } from './TextElementDefinition.ts';
import { TextElementPart } from './TextElementPart.ts';

interface OutputElement extends Element {
	readonly localName: 'output';

	getAttribute(name: 'value'): string;
	getAttribute(name: string): string | null;
}

const isOutputElement = (element: Element): element is OutputElement => {
	return element.localName === 'output' && element.hasAttribute('value');
};

export class TextElementOutputPart extends TextElementPart<'output'> {
	static from(context: AnyTextElementDefinition, element: Element): TextElementOutputPart | null {
		if (isOutputElement(element)) {
			return new this(context, element);
		}

		return null;
	}

	protected constructor(context: AnyTextElementDefinition, element: OutputElement) {
		super('output', context, element.getAttribute('value'));
	}
}
