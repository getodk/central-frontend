import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import type { XFormDefinition } from '../../parse/XFormDefinition.ts';
import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

interface LabelElement extends LocalNamedElement<'label'> {}

// TODO have two separate abstract parents - one for translated and one not.
// then we can use instanceof to enforce whether chunks or messageExpression is present
export class ItemsetLabelDefinition extends TextRangeDefinition<'item-label'> {
	static from(form: XFormDefinition, owner: ItemsetDefinition): ItemsetLabelDefinition | null {
		const labelElement = getLabelElement(owner.element);

		if (labelElement == null) {
			return null;
		}

		return new this(form, owner, labelElement);
	}

	readonly role = 'item-label';
	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>;

	private constructor(form: XFormDefinition, owner: ItemsetDefinition, element: LabelElement) {
		super(form, owner, element);

		const refExpression = element.getAttribute('ref');

		if (refExpression == null) {
			throw new Error('<itemset><label> missing ref attribute');
		}

		const translationChunk = TextChunkExpression.fromTranslation(this, refExpression);
		if (translationChunk) {
			this.chunks = [translationChunk];
		} else {
			this.chunks = [TextChunkExpression.fromReference(refExpression)];
		}
	}
}
