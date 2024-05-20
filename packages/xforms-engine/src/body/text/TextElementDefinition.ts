import {
	isCommentNode,
	isElementNode,
	isTextNode,
} from '@odk-web-forms/common/lib/dom/predicates.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { type AnyDependentExpression } from '../../expression/DependentExpression.ts';
import type { AnyGroupElementDefinition } from '../BodyDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { InputDefinition } from '../control/InputDefinition.ts';
import type { ItemDefinition } from '../control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../control/select/ItemsetDefinition.ts';
import type { AnySelectDefinition } from '../control/select/SelectDefinition.ts';
import { TextElementOutputPart } from './TextElementOutputPart.ts';
import { TextElementReferencePart } from './TextElementReferencePart.ts';
import { TextElementStaticPart } from './TextElementStaticPart.ts';

export type TextElementType = 'hint' | 'label';

export interface TextElement extends Element {
	readonly localName: TextElementType;
}

export type TextElementOwner =
	| AnyGroupElementDefinition
	| AnySelectDefinition
	| InputDefinition
	| ItemDefinition
	| ItemsetDefinition;

export type TextElementChild = TextElementOutputPart | TextElementStaticPart;

export abstract class TextElementDefinition<
	Type extends TextElementType,
> extends BodyElementDefinition<Type> {
	readonly category = 'support';
	abstract override readonly type: Type;

	override readonly reference: string | null;
	override readonly parentReference: string | null;

	readonly referenceExpression: TextElementReferencePart | null;
	readonly children: readonly TextElementChild[];

	override get isTranslated(): boolean {
		return this.owner.isTranslated;
	}

	override set isTranslated(value: true) {
		this.owner.isTranslated = value;
	}

	protected constructor(
		form: XFormDefinition,
		readonly owner: TextElementOwner,
		element: TextElement
	) {
		super(form, owner, element);

		this.reference = owner.reference;
		this.parentReference = owner.parentReference;
		this.referenceExpression = TextElementReferencePart.from(this, element);

		const children = Array.from(element.childNodes).flatMap((node) => {
			if (isTextNode(node)) {
				return new TextElementStaticPart(this, node);
			}

			if (isElementNode(node)) {
				const output = TextElementOutputPart.from(this, node);

				if (output != null) {
					return output;
				}
			}

			if (isCommentNode(node)) {
				return [];
			}

			// eslint-disable-next-line no-console
			console.error('Unexpected text element child', node);

			throw new Error(`Unexpected <${element.nodeName}> child element`);
		});

		this.children = children;
	}

	override registerDependentExpression(expression: AnyDependentExpression): void {
		this.owner.registerDependentExpression(expression);
	}

	override toJSON(): object {
		const { form, owner, parent, ...rest } = this;

		return rest;
	}
}

export type AnyTextElementDefinition = TextElementDefinition<TextElementType>;
