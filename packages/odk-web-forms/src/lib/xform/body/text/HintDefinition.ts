import { getScopeChildBySelector } from '@odk/common/lib/dom/compatibility';
import type { XFormDefinition } from '../../XFormDefinition.ts';
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
		const hintElement = getScopeChildBySelector(
			definition.element,
			':scope > hint',
			'hint'
		) as HintElement | null;

		if (hintElement == null) {
			return null;
		}

		return new this(form, definition, hintElement);
	}

	readonly type = 'hint';
}
