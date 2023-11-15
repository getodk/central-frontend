import { getScopeChildBySelector } from '@odk/common/lib/dom/compatibility.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { MixedContentTextElementDefinition } from './MixedContentTextElementDefinition.ts';

export interface HintElement extends Element {
	readonly localName: 'hint';
}

export const isHintElement = (element: Element): element is HintElement => {
	return element.localName === 'hint';
};

export class HintDefinition extends MixedContentTextElementDefinition<'hint'> {
	static forElement(form: XFormDefinition, element: Element): HintDefinition | null {
		const hintElement = getScopeChildBySelector(
			element,
			':scope > hint',
			'hint'
		) as HintElement | null;

		if (hintElement == null) {
			return null;
		}

		return new HintDefinition(form, hintElement);
	}

	override readonly type = 'hint';

	constructor(form: XFormDefinition, element: HintElement) {
		super(form, element);
	}
}
