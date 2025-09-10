import { isElementNode, isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import type { ElementTextRole } from '../../../client/TextRange.ts';
import type { XFormDefinition } from '../../../parse/XFormDefinition.ts';
import type { ItemDefinition } from '../../body/control/ItemDefinition.ts';
import { TextChunkExpression } from '../../expression/TextChunkExpression.ts';
import { parseNodesetReference } from '../../xpath/reference-parsing.ts';
import type { HintDefinition } from '../HintDefinition.ts';
import type { ItemLabelDefinition } from '../ItemLabelDefinition.ts';
import type { ItemsetLabelDefinition } from '../ItemsetLabelDefinition.ts';
import type { LabelDefinition, LabelOwner } from '../LabelDefinition.ts';
import type { TextSourceNode } from './TextRangeDefinition.ts';
import { TextRangeDefinition } from './TextRangeDefinition.ts';

type TextElementOwner = ItemDefinition | LabelOwner;

export abstract class TextElementDefinition<
	Role extends ElementTextRole,
> extends TextRangeDefinition<Role> {
	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>;

	constructor(form: XFormDefinition, owner: TextElementOwner, sourceNode: TextSourceNode<Role>) {
		super(form, owner, sourceNode);

		const context = this as AnyTextElementDefinition;
		const refExpression = parseNodesetReference(owner, sourceNode, 'ref');

		if (refExpression == null) {
			this.chunks = Array.from(sourceNode.childNodes).flatMap((childNode) => {
				if (isElementNode(childNode)) {
					return TextChunkExpression.fromOutput(childNode) ?? [];
				}

				if (isTextNode(childNode)) {
					return TextChunkExpression.fromLiteral(childNode.data);
				}

				return [];
			});
		} else {

			const translationChunk = TextChunkExpression.fromTranslation(context, refExpression);
			if (translationChunk) {
				this.chunks = [translationChunk];
			} else {
				this.chunks = [TextChunkExpression.fromReference(refExpression)];
			}
		}
	}
}

// prettier-ignore
export type AnyTextElementDefinition =
	| HintDefinition
	| ItemLabelDefinition
	| ItemsetLabelDefinition
	| LabelDefinition;
