import type { AnyInputNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class InputNodeAnswer extends ValueNodeAnswer<AnyInputNode> {
	get stringValue(): string {
		return this.node.currentState.instanceValue;
	}
}
