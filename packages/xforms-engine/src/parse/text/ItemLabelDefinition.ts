import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { ItemDefinition } from '../../body/control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../body/control/select/ItemsetDefinition.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import { TextElementDefinition } from './abstract/TextElementDefinition.ts';

export type ItemLabelOwner = ItemDefinition | ItemsetDefinition;

interface LabelElement extends LocalNamedElement<'label'> {}

export class ItemLabelDefinition extends TextElementDefinition<'item-label'> {
	static from(form: XFormDefinition, owner: ItemLabelOwner): ItemLabelDefinition | null {
		const labelElement = getLabelElement(owner.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, owner, labelElement);
	}

	readonly role = 'item-label';

	private constructor(form: XFormDefinition, owner: ItemLabelOwner, element: LabelElement) {
		super(form, owner, element);
	}
}
