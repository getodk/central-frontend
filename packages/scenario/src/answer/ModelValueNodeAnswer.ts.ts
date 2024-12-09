import type { AnyModelValueNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class ModelValueNodeAnswer extends ValueNodeAnswer<AnyModelValueNode> {
	get stringValue(): string {
		return this.node.currentState.instanceValue;
	}
}
