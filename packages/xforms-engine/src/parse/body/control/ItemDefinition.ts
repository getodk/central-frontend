import type { ItemElement } from '../../../lib/dom/query.ts';
import { getValueElement } from '../../../lib/dom/query.ts';
import { ItemLabelDefinition } from '../../text/ItemLabelDefinition.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { AnySelectControlDefinition } from './SelectControlDefinition.ts';
import { RankControlDefinition } from './RankControlDefinition.ts';

export class ItemDefinition extends BodyElementDefinition<'item'> {
	override readonly category = 'support';
	override readonly type = 'item';

	override readonly label: ItemLabelDefinition | null;
	readonly value: string;

	constructor(
		form: XFormDefinition,
		override readonly parent: AnySelectControlDefinition | RankControlDefinition,
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
