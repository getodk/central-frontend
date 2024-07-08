import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { ItemDefinition } from '../../body/control/select/ItemDefinition.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import { TextElementDefinition } from './abstract/TextElementDefinition.ts';

interface LabelElement extends LocalNamedElement<'label'> {}

export class ItemLabelDefinition extends TextElementDefinition<'item-label'> {
	static from(form: XFormDefinition, owner: ItemDefinition): ItemLabelDefinition | null {
		const labelElement = getLabelElement(owner.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, owner, labelElement);
	}

	readonly role = 'item-label';

	private constructor(form: XFormDefinition, owner: ItemDefinition, element: LabelElement) {
		super(form, owner, element);
	}
}
