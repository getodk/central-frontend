import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getLabelElement } from '../../query.ts';
import type { TextElement, TextElementContext } from './TextElementDefinition.ts';
import { TextElementDefinition } from './TextElementDefinition.ts';

export interface LabelElement extends TextElement {
	readonly localName: 'label';
}

export class LabelDefinition extends TextElementDefinition<'label'> {
	static forElement(form: XFormDefinition, definition: TextElementContext): LabelDefinition | null {
		const labelElement = getLabelElement(definition.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, definition, labelElement);
	}

	readonly type = 'label';
}
