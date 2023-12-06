import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { TextElementPart } from './TextElementPart.ts';

type TextElementType = 'hint' | 'label' | 'output';

export abstract class BaseTextElementDefinition<
	Type extends TextElementType,
> extends BodyElementDefinition<Type> {
	override readonly category = 'support';
	abstract override readonly type: Type;
	abstract readonly parts: readonly TextElementPart[];
	override readonly reference: null = null;
}
