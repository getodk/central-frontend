import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { SelectNode, SelectValues, ValueType } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class SelectNodeAnswer<V extends ValueType = ValueType> extends ValueNodeAnswer<
	SelectNode<V>
> {
	readonly valueType: V;
	readonly stringValue: string;
	readonly value: SelectValues<V>;

	constructor(node: SelectNode<V>) {
		super(node);

		this.valueType = node.valueType;
		this.stringValue = node.currentState.instanceValue;
		this.value = node.currentState.value.slice();
	}

	override inspectValue(): JSONValue {
		return this.stringValue;
	}
}
