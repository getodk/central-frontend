import { isElementNode, isTextNode } from '@getodk/common/lib/dom/predicates.ts';
import type { ElementTextRole } from '../../../client/TextRange.ts';
import type { XFormDefinition } from '../../../parse/XFormDefinition.ts';
import type { ItemDefinition } from '../../body/control/ItemDefinition.ts';
import { TextLiteralExpression } from '../../expression/TextLiteralExpression.ts';
import { TextOutputExpression } from '../../expression/TextOutputExpression.ts';
import { TextReferenceExpression } from '../../expression/TextReferenceExpression.ts';
import { TextTranslationExpression } from '../../expression/TextTranslationExpression.ts';
import { parseNodesetReference } from '../../xpath/reference-parsing.ts';
import type { HintDefinition } from '../HintDefinition.ts';
import type { ItemLabelDefinition } from '../ItemLabelDefinition.ts';
import type { ItemsetLabelDefinition } from '../ItemsetLabelDefinition.ts';
import type { LabelDefinition, LabelOwner } from '../LabelDefinition.ts';
import type { TextSourceNode } from './TextRangeDefinition.ts';
import { TextRangeDefinition } from './TextRangeDefinition.ts';

// prettier-ignore
export type RefAttributeChunk =
	| TextReferenceExpression
	| TextTranslationExpression;

// prettier-ignore
type TextElementChildChunk =
	| TextOutputExpression
	| TextLiteralExpression;

// prettier-ignore
type TextElementChunks =
	| readonly [RefAttributeChunk]
	| readonly TextElementChildChunk[];

type TextElementOwner = ItemDefinition | LabelOwner;

export abstract class TextElementDefinition<
	Role extends ElementTextRole,
> extends TextRangeDefinition<Role> {
	readonly chunks: TextElementChunks;

	constructor(form: XFormDefinition, owner: TextElementOwner, sourceNode: TextSourceNode<Role>) {
		super(form, owner, sourceNode);

		const context = this as AnyTextElementDefinition;
		const refExpression = parseNodesetReference(owner, sourceNode, 'ref');

		if (refExpression == null) {
			this.chunks = Array.from(sourceNode.childNodes).flatMap((childNode) => {
				if (isElementNode(childNode)) {
					return TextOutputExpression.from(context, childNode) ?? [];
				}

				if (isTextNode(childNode)) {
					return TextLiteralExpression.from(context, childNode.data);
				}

				return [];
			});
		} else {
			const refChunk =
				TextTranslationExpression.from(context, refExpression) ??
				TextReferenceExpression.from(context, refExpression);
			this.chunks = [refChunk];
		}
	}
}

// prettier-ignore
export type AnyTextElementDefinition =
	| HintDefinition
	| ItemLabelDefinition
	| ItemsetLabelDefinition
	| LabelDefinition;
