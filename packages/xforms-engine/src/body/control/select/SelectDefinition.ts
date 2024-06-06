import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../../XFormDefinition.ts';
import { getItemElements, getItemsetElement } from '../../../lib/dom/query.ts';
import type { AnyBodyElementDefinition, BodyElementParentContext } from '../../BodyDefinition.ts';
import type { SelectAppearanceDefinition } from '../../appearance/selectAppearanceParser.ts';
import { selectAppearanceParser } from '../../appearance/selectAppearanceParser.ts';
import { ControlDefinition } from '../ControlDefinition.ts';
import { ItemDefinition } from './ItemDefinition.ts';
import { ItemsetDefinition } from './ItemsetDefinition.ts';

/**
 * @todo We were previously a bit overzealous about introducing `<rank>` support
 * here. It'll likely still fit, but we should approach it with more intention.
 *
 * @todo `<trigger>` is *almost* reasonable to support here too. The main
 * hesitation is that its single, implicit "item" does not have a distinct
 * <label>, and presumably has different UX **and translation** considerations.
 */
const selectLocalNames = new Set([/* 'rank', */ 'select', 'select1'] as const);

export type SelectType = CollectionValues<typeof selectLocalNames>;

export interface SelectElement extends LocalNamedElement<SelectType> {}

const isSelectElement = (
	element: Element,
	localName: string = element.localName
): element is SelectElement => {
	return selectLocalNames.has(localName as SelectType);
};

export class SelectDefinition<Type extends SelectType> extends ControlDefinition<Type> {
	static override isCompatible(localName: string, element: Element): boolean {
		return isSelectElement(element, localName);
	}

	static isSelect(element: AnyBodyElementDefinition): element is AnySelectDefinition {
		return selectLocalNames.has(element.type as SelectType);
	}

	override readonly type: Type;
	override readonly element: SelectElement;
	readonly appearances: SelectAppearanceDefinition;

	readonly itemset: ItemsetDefinition | null;
	readonly items: readonly ItemDefinition[];

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		if (!isSelectElement(element)) {
			throw new Error(`Invalid select element: <${element.nodeName}>`);
		}

		super(form, parent, element);

		this.type = element.localName as Type;
		this.element = element;
		this.appearances = selectAppearanceParser.parseFrom(element, 'appearance');

		const itemsetElement = getItemsetElement(element);
		const itemElements = getItemElements(element);

		if (itemsetElement == null) {
			this.itemset = null;
			this.items = itemElements.map((itemElement) => {
				return new ItemDefinition(form, this, itemElement);
			});
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

export type AnySelectDefinition = SelectDefinition<SelectType>;
