import type { StringNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class StringNodeAnswer extends ValueNodeAnswer<StringNode> {
	get stringValue(): string {
		return this.node.currentState.value;
	}
}
