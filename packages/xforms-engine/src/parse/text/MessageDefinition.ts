import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { TextChunkExpression } from '../expression/TextChunkExpression.ts';
import type { BindDefinition } from '../model/BindDefinition.ts';
import type { TextBindAttributeLocalName } from './abstract/TextRangeDefinition.ts';
import { TextRangeDefinition } from './abstract/TextRangeDefinition.ts';

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

	readonly chunks: ReadonlyArray<TextChunkExpression<'nodes' | 'string'>>;

	private constructor(
		bind: BindDefinition,
		readonly role: Type,
		message: string
	) {
		super(bind.form, bind, null);

		const expression = TextChunkExpression.fromTranslation(this, message);
		if (expression != null) {
			this.chunks = [expression];
		} else {
			this.chunks = [TextChunkExpression.fromLiteral(this, message)];
		}
	}
}

// prettier-ignore
export type AnyMessageDefinition = MessageDefinition<TextBindAttributeLocalName>;
