import type { RangeNode, RangeValue, RangeValueType } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class RangeNodeAnswer<V extends RangeValueType = RangeValueType> extends ValueNodeAnswer<
	RangeNode<V>
> {
	readonly valueType: V;
	readonly stringValue: string;
	readonly value: RangeValue<V>;

	constructor(node: RangeNode<V>) {
		super(node);
		this.valueType = node.valueType;
		this.stringValue = this.node.currentState.instanceValue;
		this.value = this.node.currentState.value;
	}
}
