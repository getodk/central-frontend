import { getItemElements, getItemsetElement } from '../../../lib/dom/query.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { ItemDefinition } from './ItemDefinition.ts';
import { ItemsetDefinition } from './ItemsetDefinition.ts';
import type { RangeControlDefinition } from './RangeControlDefinition.ts';
import type { RankControlDefinition } from './RankControlDefinition.ts';
import type { AnySelectControlDefinition } from './SelectControlDefinition.ts';

// prettier-ignore
export type ItemCollectionControlDefinition =
	| AnySelectControlDefinition
	| RangeControlDefinition
	| RankControlDefinition;

export interface ItemCollectionDefinition {
  readonly items: readonly ItemDefinition[];
  readonly itemset: ItemsetDefinition | null;
}

/**
 * Parses the `<item>` children or the single `<itemset>` child of a control.
 * A control may have one or the other, not both.
 */
export const parseItemCollection = (
  form: XFormDefinition,
  parent: ItemCollectionControlDefinition
): ItemCollectionDefinition => {
  const { element } = parent;
  const itemsetElement = getItemsetElement(element);
  const itemElements = getItemElements(element);

  if (itemsetElement == null) {
    return {
      items: itemElements.map((itemElement) => new ItemDefinition(form, parent, itemElement)),
      itemset: null,
    };
  }

  if (itemElements.length > 0) {
    throw new Error(`<${element.nodeName}> has both <itemset> and <item> children`);
  }

  return {
    items: [],
    itemset: new ItemsetDefinition(form, parent, itemsetElement),
  };
};
