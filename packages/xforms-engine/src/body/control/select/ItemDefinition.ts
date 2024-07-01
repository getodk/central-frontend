import { getValueElement, type ItemElement } from '../../../lib/dom/query.ts';
import { ItemLabelDefinition } from '../../../parse/text/ItemLabelDefinition.ts';
import type { XFormDefinition } from '../../../XFormDefinition.ts';
import { BodyElementDefinition } from '../../BodyElementDefinition.ts';
import type { AnySelectDefinition } from './SelectDefinition.ts';

export class ItemDefinition extends BodyElementDefinition<'item'> {
	override readonly category = 'support';
	override readonly type = 'item';

	override readonly label: ItemLabelDefinition | null;
	readonly value: string;

	constructor(
		form: XFormDefinition,
		override readonly parent: AnySelectDefinition,
		element: ItemElement
	) {
		const valueElement = getValueElement(element);
		const value = valueElement?.textContent;

		if (value == null) {
			throw new Error('<item> has no <value>');
		}

		super(form, parent, element);

		this.label = ItemLabelDefinition.from(form, this);
		this.value = value;
	}
}
