import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../../XFormDefinition.ts';
import type { TextRole } from '../../../client/TextRange.ts';
import { DependencyContext } from '../../../expression/DependencyContext.ts';
import type { AnyDependentExpression } from '../../../expression/DependentExpression.ts';
import type { AnyMessageDefinition } from '../MessageDefinition.ts';
import type { AnyTextChunkDefinition } from './TextChunkDefinition.ts';
import type { AnyTextElementDefinition } from './TextElementDefinition.ts';

export type TextBindAttributeLocalName = 'constraintMsg' | 'requiredMsg';
export type TextBodyElementLocalName = 'hint' | 'label';

interface TextSourceNodes {
	readonly constraintMsg: null;
	readonly hint: LocalNamedElement<'hint'>;
	readonly label: LocalNamedElement<'label'>;
	readonly 'item-label': LocalNamedElement<'label'>;
	readonly requiredMsg: null;
}

export type TextSourceNode<Type extends TextRole> = TextSourceNodes[Type];

export abstract class TextRangeDefinition<Role extends TextRole> extends DependencyContext {
	abstract readonly role: Role;
	readonly parentReference: string | null;
	readonly reference: string | null;

	abstract readonly chunks: readonly AnyTextChunkDefinition[];

	override get isTranslated(): boolean {
		return (
			this.ownerContext.isTranslated || this.chunks.some((chunk) => chunk.source === 'translation')
		);
	}

	override set isTranslated(value: true) {
		if (this.ownerContext != null) {
			this.ownerContext.isTranslated = value;
		}

		super.isTranslated = value;
	}

	protected constructor(
		readonly form: XFormDefinition,
		readonly ownerContext: DependencyContext,
		readonly sourceNode: TextSourceNode<Role>
	) {
		super();

		this.reference = ownerContext.reference;
		this.parentReference = ownerContext.parentReference;
	}

	override registerDependentExpression(expression: AnyDependentExpression): void {
		this.ownerContext.registerDependentExpression(expression);
		super.registerDependentExpression(expression);
	}

	toJSON(): object {
		const { form, ownerContext, ...rest } = this;

		return rest;
	}
}

// prettier-ignore
export type AnyTextRangeDefinition =
	| AnyMessageDefinition
	| AnyTextElementDefinition;
