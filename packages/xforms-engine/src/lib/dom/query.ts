import { ScopedElementLookup } from '@getodk/common/lib/dom/compatibility.ts';
import type {
	KnownAttributeLocalNamedElement,
	LocalNamedElement,
} from '@getodk/common/types/dom.ts';
import type { SelectElement } from '../../body/control/select/SelectDefinition';

const hintLookup = new ScopedElementLookup(':scope > hint', 'hint');
const itemLookup = new ScopedElementLookup(':scope > item', 'item');
const itemsetLookup = new ScopedElementLookup(':scope > itemset[nodeset]', 'itemset[nodeset]');
const labelLookup = new ScopedElementLookup(':scope > label', 'label');
const repeatLookup = new ScopedElementLookup(':scope > repeat[nodeset]', 'repeat[nodeset]');
const valueLookup = new ScopedElementLookup(':scope > value', 'value');

export interface HintElement extends LocalNamedElement<'hint'> {}

export interface ItemElement extends LocalNamedElement<'item'> {}

export interface ItemsetElement extends KnownAttributeLocalNamedElement<'itemset', 'nodeset'> {}

export interface LabelElement extends LocalNamedElement<'label'> {}

export interface RepeatElement extends KnownAttributeLocalNamedElement<'repeat', 'nodeset'> {}

export interface ValueElement extends LocalNamedElement<'value'> {}

export const getHintElement = (parent: Element): HintElement | null => {
	return hintLookup.getElement<HintElement>(parent);
};

export const getItemElements = (parent: SelectElement): readonly ItemElement[] => {
	return Array.from(itemLookup.getElements<ItemElement>(parent));
};

export const getItemsetElement = (parent: Element): ItemsetElement | null => {
	return itemsetLookup.getElement<ItemsetElement>(parent);
};

export const getLabelElement = (parent: Element): LabelElement | null => {
	return labelLookup.getElement<LabelElement>(parent);
};

export const getRepeatElement = (parent: Element): RepeatElement | null => {
	return repeatLookup.getElement<RepeatElement>(parent);
};

export const getValueElement = (parent: ItemElement | ItemsetElement): ValueElement | null => {
	return valueLookup.getElement<ValueElement>(parent);
};
