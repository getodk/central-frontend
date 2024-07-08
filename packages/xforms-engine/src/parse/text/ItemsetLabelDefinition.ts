import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { ItemDefinition } from '../../body/control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../body/control/select/ItemsetDefinition.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import { ReferenceChunkDefinition } from './ReferenceChunkDefinition.ts';
import { TranslationChunkDefinition } from './TranslationChunkDefinition.ts';
import type { RefAttributeChunk } from './abstract/TextElementDefinition.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export type ItemLabelOwner = ItemDefinition | ItemsetDefinition;

interface LabelElement extends LocalNamedElement<'label'> {}

export class ItemsetLabelDefinition extends TextRangeDefinition<'item-label'> {
	static from(form: XFormDefinition, owner: ItemsetDefinition): ItemsetLabelDefinition | null {
		const labelElement = getLabelElement(owner.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, owner, labelElement);
	}

	readonly role = 'item-label';
	readonly chunks: readonly [RefAttributeChunk];

	private constructor(form: XFormDefinition, owner: ItemsetDefinition, element: LabelElement) {
		super(form, owner, element);

		const refExpression = element.getAttribute('ref');

		if (refExpression == null) {
			throw new Error('<itemset><label> missing ref attribute');
		}

		const refChunk =
			TranslationChunkDefinition.from(this, refExpression) ??
			ReferenceChunkDefinition.from(this, refExpression);

		this.chunks = [refChunk];
	}
}
