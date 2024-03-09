import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getHintElement } from '../../query.ts';
import type { AnyControlDefinition } from '../control/ControlDefinition.ts';
import type { TextElement } from './TextElementDefinition.ts';
import { TextElementDefinition } from './TextElementDefinition.ts';

export interface HintElement extends TextElement {
	readonly localName: 'hint';
}

export class HintDefinition extends TextElementDefinition<'hint'> {
	static forElement(
		form: XFormDefinition,
		definition: AnyControlDefinition
	): HintDefinition | null {
		const hintElement = getHintElement(definition.element);

		if (hintElement == null) {
			return null;
		}

		return new this(form, definition, hintElement);
	}

	readonly type = 'hint';
}
