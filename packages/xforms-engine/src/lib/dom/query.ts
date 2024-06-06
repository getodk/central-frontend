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
const repeatGroupLabelLookup = new ScopedElementLookup(
	':scope > label[form-definition-source="repeat-group"]',
	'label[form-definition-source="repeat-group"]'
);
const repeatLookup = new ScopedElementLookup(':scope > repeat[nodeset]', 'repeat[nodeset]');
const valueLookup = new ScopedElementLookup(':scope > value', 'value');

export interface HintElement extends LocalNamedElement<'hint'> {}

export interface ItemElement extends LocalNamedElement<'item'> {}

export interface ItemsetElement extends KnownAttributeLocalNamedElement<'itemset', 'nodeset'> {}

export interface LabelElement extends LocalNamedElement<'label'> {}

export interface RepeatGroupLabelElement extends LabelElement {
	getAttribute(name: 'form-definition-source'): 'repeat-group';
	getAttribute(name: string): string;
}

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

export const getRepeatGroupLabelElement = (parent: Element): RepeatGroupLabelElement | null => {
	return repeatGroupLabelLookup.getElement<RepeatGroupLabelElement>(parent);
};

export const getRepeatElement = (parent: Element): RepeatElement | null => {
	return repeatLookup.getElement<RepeatElement>(parent);
};

export const getValueElement = (parent: ItemElement | ItemsetElement): ValueElement | null => {
	return valueLookup.getElement<ValueElement>(parent);
};
