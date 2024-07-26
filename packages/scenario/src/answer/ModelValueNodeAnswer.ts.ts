import type { ModelValueNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class ModelValueNodeAnswer extends ValueNodeAnswer<ModelValueNode> {
	get stringValue(): string {
		return this.node.currentState.value;
	}
}
