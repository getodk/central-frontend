import type { InputNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class InputNodeAnswer extends ValueNodeAnswer<InputNode> {
	get stringValue(): string {
		return this.node.currentState.value;
	}
}
