import { getScopeChildBySelector } from '@odk/common/lib/dom/compatibility';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { TextElement, TextElementContext } from './TextElementDefinition.ts';
import { TextElementDefinition } from './TextElementDefinition.ts';

export interface LabelElement extends TextElement {
	readonly localName: 'label';
}

export class LabelDefinition extends TextElementDefinition<'label'> {
	static forElement(form: XFormDefinition, definition: TextElementContext): LabelDefinition | null {
		const labelElement = getScopeChildBySelector(
			definition.element,
			':scope > label',
			'label'
		) as LabelElement | null;

		if (labelElement == null) {
			return null;
		}

		return new this(form, definition, labelElement);
	}

	readonly type = 'label';
}
