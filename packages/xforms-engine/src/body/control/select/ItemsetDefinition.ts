import { getValueElement, type ItemsetElement } from '../../../lib/dom/query.ts';
import { ItemLabelDefinition } from '../../../parse/text/ItemLabelDefinition.ts';
import type { XFormDefinition } from '../../../XFormDefinition.ts';
import { BodyElementDefinition } from '../../BodyElementDefinition.ts';
import { ItemsetNodesetExpression } from './ItemsetNodesetExpression.ts';
import { ItemsetValueExpression } from './ItemsetValueExpression.ts';
import type { AnySelectDefinition } from './SelectDefinition.ts';

export class ItemsetDefinition extends BodyElementDefinition<'itemset'> {
	override readonly category = 'support';
	readonly type = 'itemset';

	override readonly reference: string;
	override readonly label: ItemLabelDefinition | null;

	readonly nodes: ItemsetNodesetExpression;
	readonly value: ItemsetValueExpression;

	constructor(form: XFormDefinition, select: AnySelectDefinition, element: ItemsetElement) {
		const valueElement = getValueElement(element);
		const valueExpression = valueElement?.getAttribute('ref');

		if (valueExpression == null) {
			throw new Error(`<itemset> has no <value>`);
		}

		super(form, select, element);

		const nodesetExpression = element.getAttribute('nodeset');

		this.reference = nodesetExpression;
		this.nodes = new ItemsetNodesetExpression(this, nodesetExpression);
		this.value = new ItemsetValueExpression(this, valueExpression);
		this.label = ItemLabelDefinition.from(form, this);
	}
}
