import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import type { BindDefinition } from '../model/BindDefinition.ts';
import type { TextBindAttributeLocalName, TextSourceNode } from './abstract/TextRangeDefinition.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

export type MessageSourceNode = TextSourceNode<TextBindAttributeLocalName>;

export class MessageDefinition<
	Type extends TextBindAttributeLocalName,
> extends TextRangeDefinition<Type> {
	static from<Type extends TextBindAttributeLocalName>(
		bind: BindDefinition,
		type: Type
	): MessageDefinition<Type> | null {
		const message = bind.bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, type);

		if (message == null) {
			return null;
		}

		return new this(bind, type, message);
	}

	readonly chunks: readonly [TextChunkExpression];

	private constructor(
		bind: BindDefinition,
		readonly role: Type,
		message: string
	) {
		super(bind.form, bind, null);

		const chunk: TextChunkExpression =
			TextChunkExpression.fromTranslation(this, message) ??
			TextChunkExpression.fromLiteral(this, message);

		this.chunks = [chunk];
	}
}

// prettier-ignore
export type AnyMessageDefinition = MessageDefinition<TextBindAttributeLocalName>;
