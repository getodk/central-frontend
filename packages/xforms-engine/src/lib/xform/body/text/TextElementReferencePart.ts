import type { AnyTextElementDefinition, TextElement } from './TextElementDefinition.ts';
import { TextElementPart } from './TextElementPart.ts';

export class TextElementReferencePart extends TextElementPart<'reference'> {
	static from(
		context: AnyTextElementDefinition,
		element: TextElement
	): TextElementReferencePart | null {
		const expression = element.getAttribute('ref');

		if (expression == null) {
			return null;
		}

		return new this(context, expression);
	}

	protected constructor(context: AnyTextElementDefinition, expression: string) {
		super('reference', context, expression);
	}
}
