import { getScopeChildBySelector } from '@odk/common/lib/dom/compatibility.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { MixedContentTextElementDefinition } from './MixedContentTextElementDefinition.ts';

export interface LabelElement extends Element {
	readonly localName: 'label';
}

export const isLabelElement = (element: Element): element is LabelElement => {
	return element.localName === 'label';
};

export class LabelDefinition extends MixedContentTextElementDefinition<'label'> {
	static forElement(form: XFormDefinition, element: Element): LabelDefinition | null {
		const labelElement = getScopeChildBySelector(
			element,
			':scope > label',
			'label'
		) as LabelElement | null;

		if (labelElement == null) {
			return null;
		}

		return new LabelDefinition(form, labelElement);
	}

	override readonly type = 'label';

	constructor(form: XFormDefinition, element: LabelElement) {
		super(form, element);
	}
}
