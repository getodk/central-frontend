import type { AnyUnsupportedControlNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class UnsupportedControlNodeAnswer extends ValueNodeAnswer<AnyUnsupportedControlNode> {
	get stringValue(): string {
		const { value } = this.node.currentState;

		if (typeof value === 'string') {
			return value;
		}

		throw new Error(`Cannot get string value for node (type: ${this.node.nodeType})`);
	}
}
