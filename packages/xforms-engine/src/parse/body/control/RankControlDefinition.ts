import { getItemElements, getItemsetElement } from '../../../lib/dom/query.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';
import { ItemsetDefinition } from './ItemsetDefinition.ts';
import { ItemDefinition } from './ItemDefinition.ts';
import {
	type UnknownAppearanceDefinition,
	unknownAppearanceParser,
} from '../appearance/unknownAppearanceParser.ts';

export class RankControlDefinition extends ControlDefinition<'rank'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'rank';
	}

	readonly type = 'rank';
	readonly appearances: UnknownAppearanceDefinition;
	readonly itemset: ItemsetDefinition | null;
	readonly items: readonly ItemDefinition[];

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');
		const itemsetElement = getItemsetElement(element);
		const itemElements = getItemElements(element);

		if (itemsetElement === null || itemElements === undefined) {
			this.itemset = null;
			this.items = itemElements.map((itemElement) => new ItemDefinition(form, this, itemElement));
		} else {
			if (itemElements.length > 0) {
				throw new Error(`<${element.nodeName}> has both <itemset> and <item> children`);
			}

			this.items = [];
			this.itemset = new ItemsetDefinition(form, this, itemsetElement);
		}
	}

	override toJSON() {
		return {};
	}
}
