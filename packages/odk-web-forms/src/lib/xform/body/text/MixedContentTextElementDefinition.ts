import { isCommentNode, isElementNode, isTextNode } from '@odk/common/lib/dom/predicates.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { BaseTextElementDefinition } from './BaseTextElementDefinition.ts';
import { OutputDefintion, isOutputElement } from './OutputDefinition.ts';
import { TextElementExpressionPart } from './TextElementExpressionPart.ts';
import type { TextElementPart } from './TextElementPart.ts';
import { TextElementStaticPart } from './TextElementStaticPart.ts';

type MixedContentTextElementType = 'hint' | 'label';

export abstract class MixedContentTextElementDefinition<
	Type extends MixedContentTextElementType,
> extends BaseTextElementDefinition<Type> {
	readonly parts: readonly TextElementPart[];

	constructor(form: XFormDefinition, element: Element) {
		super(form, element);

		const ref = element.getAttribute('ref');
		const parts: TextElementPart[] = [];

		if (ref == null) {
			for (const childNode of element.childNodes) {
				if (isElementNode(childNode)) {
					if (isOutputElement(childNode)) {
						const part = new OutputDefintion(form, childNode);

						parts.push(part);
					} else {
						console.warn('Unexpected text element child', childNode);
					}
				} else if (isTextNode(childNode)) {
					const part = new TextElementStaticPart(childNode);

					parts.push(part);
				} else if (!isCommentNode(childNode)) {
					console.warn('Unexpected text element child node', childNode);
				}
			}
		} else {
			// TODO: this does not yet handle itext fallbacks
			parts.push(new TextElementExpressionPart(ref));
		}

		this.parts = parts;
	}
}
