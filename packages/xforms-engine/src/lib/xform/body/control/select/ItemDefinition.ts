import type { XFormDefinition } from '../../../XFormDefinition.ts';
import { getValueElement, type ItemElement } from '../../../query.ts';
import { BodyElementDefinition } from '../../BodyElementDefinition.ts';
import { LabelDefinition } from '../../text/LabelDefinition.ts';
import type { AnySelectDefinition } from './SelectDefinition.ts';

export class ItemDefinition extends BodyElementDefinition<'item'> {
	override readonly category = 'support';
	override readonly type = 'item';

	override readonly label: LabelDefinition | null;
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

		this.label = LabelDefinition.forItem(form, this);
		this.value = value;
	}
}
