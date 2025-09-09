import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import type { XFormDefinition } from '../../parse/XFormDefinition.ts';
import type { ItemsetDefinition } from '../body/control/ItemsetDefinition.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import { isTranslationExpression } from '../xpath/semantic-analysis.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

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
	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>;
	readonly messageExpression: string | null = null;

	private constructor(form: XFormDefinition, owner: ItemsetDefinition, element: LabelElement) {
		super(form, owner, element);

		const refExpression = element.getAttribute('ref');

		if (refExpression == null) {
			throw new Error('<itemset><label> missing ref attribute');
		}

		if (isTranslationExpression(refExpression)) {
			this.isTranslated = true;
			this.messageExpression = /jr:itext\((.*)\)/.exec(refExpression)?.[1]!; // TODO it must match because of isTranslationExpression
			this.chunks = [];
		} else {
			this.chunks = [TextChunkExpression.fromReference(this, refExpression)];
		}
	}
}
