import { ScopedElementLookup } from '@odk/common/lib/dom/compatibility.ts';
import type { KnownAttributeLocalNamedElement, LocalNamedElement } from '@odk/common/types/dom.ts';

const hintLookup = new ScopedElementLookup(':scope > hint', 'hint');
const labelLookup = new ScopedElementLookup(':scope > label', 'label');
const repeatLookup = new ScopedElementLookup(':scope > repeat[nodeset]', 'repeat[nodeset]');

export interface HintElement extends LocalNamedElement<'hint'> {}

export interface LabelElement extends LocalNamedElement<'label'> {}

export interface RepeatElement extends KnownAttributeLocalNamedElement<'repeat', 'nodeset'> {}

export const getHintElement = (parent: Element): HintElement | null => {
	return hintLookup.getElement<HintElement>(parent);
};

export const getLabelElement = (parent: Element): LabelElement | null => {
	return labelLookup.getElement<LabelElement>(parent);
};

export const getRepeatElement = (parent: Element): RepeatElement | null => {
	return repeatLookup.getElement<RepeatElement>(parent);
};
