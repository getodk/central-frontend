import type { XFormDefinition } from '../../../XFormDefinition.ts';
import { getValueElement, type ItemsetElement } from '../../../lib/dom/query.ts';
import { ItemsetLabelDefinition } from '../../../parse/text/ItemsetLabelDefinition.ts';
import { parseNodesetReference } from '../../../parse/xpath/reference-parsing.ts';
import { BodyElementDefinition } from '../../BodyElementDefinition.ts';
import { ItemsetNodesetExpression } from './ItemsetNodesetExpression.ts';
import { ItemsetValueExpression } from './ItemsetValueExpression.ts';
import type { AnySelectDefinition } from './SelectDefinition.ts';

export class ItemsetDefinition extends BodyElementDefinition<'itemset'> {
	override readonly category = 'support';
	readonly type = 'itemset';

	override readonly reference: string;
	override readonly label: ItemsetLabelDefinition | null;

	readonly nodes: ItemsetNodesetExpression;
	readonly value: ItemsetValueExpression;

	constructor(
		form: XFormDefinition,
		override readonly parent: AnySelectDefinition,
		element: ItemsetElement
	) {
		super(form, parent, element);

		const nodesetExpression = parseNodesetReference(parent, element, 'nodeset');

		this.nodes = new ItemsetNodesetExpression(this, nodesetExpression);
		this.reference = nodesetExpression;

		const valueElement = getValueElement(element);

		if (valueElement == null) {
			throw new Error('<itemset> has no <value>');
		}

		const valueExpression = parseNodesetReference(
			{
				reference: null,
			},
			valueElement,
			'ref'
		);

		if (valueExpression == null) {
			throw new Error(`<itemset> has no <value>`);
		}

		this.value = new ItemsetValueExpression(this, valueExpression);
		this.label = ItemsetLabelDefinition.from(form, this);
	}
}
