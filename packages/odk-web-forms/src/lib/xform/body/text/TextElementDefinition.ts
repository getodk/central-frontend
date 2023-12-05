import { isCommentNode, isElementNode, isTextNode } from '@odk/common/lib/dom/predicates.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { DependentExpression } from '../../expression/DependentExpression.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { AnyControlDefinition } from '../control/ControlDefinition.ts';
import type { BaseGroupDefinition } from '../group/BaseGroupDefinition.ts';
import { TextElementOutputPart } from './TextElementOutputPart.ts';
import { TextElementReferencePart } from './TextElementReferencePart.ts';
import { TextElementStaticPart } from './TextElementStaticPart.ts';

export type TextElementType = 'hint' | 'label';

export interface TextElement extends Element {
	readonly localName: TextElementType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TextElementContext = AnyControlDefinition | BaseGroupDefinition<any>;

type TextElementChild = TextElementOutputPart | TextElementStaticPart;

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
		readonly owner: TextElementContext,
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

			console.error('Unexpected text element child', node);

			throw new Error(`Unexpected <${element.nodeName}> child element`);
		});

		this.children = children;
	}

	override registerDependentExpression(expression: DependentExpression): void {
		this.owner.registerDependentExpression(expression);
	}

	override toJSON(): object {
		const { form, owner, ...rest } = this;

		return rest;
	}
}

export type AnyTextElementDefinition = TextElementDefinition<TextElementType>;
