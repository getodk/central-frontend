import type { InputNode, InputValue, ValueType } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class InputNodeAnswer<V extends ValueType = ValueType> extends ValueNodeAnswer<
	InputNode<V>
> {
	readonly valueType: V;
	readonly stringValue: string;
	readonly value: InputValue<V>;

	constructor(node: InputNode<V>) {
		super(node);
		this.valueType = node.valueType;
		this.stringValue = this.node.currentState.instanceValue;
		this.value = this.node.currentState.value;
	}
}
