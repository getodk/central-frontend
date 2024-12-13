import type { ModelValue, ModelValueNode, ValueType } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class ModelValueNodeAnswer<V extends ValueType> extends ValueNodeAnswer<ModelValueNode<V>> {
	readonly valueType: V;
	readonly stringValue: string;
	readonly value: ModelValue<V>;

	constructor(node: ModelValueNode<V>) {
		super(node);
		this.valueType = node.valueType;
		this.stringValue = node.currentState.instanceValue;
		this.value = node.currentState.value;
	}
}

export type AnyModelValueNodeAnswer = {
	[V in ValueType]: ModelValueNodeAnswer<V>;
};
