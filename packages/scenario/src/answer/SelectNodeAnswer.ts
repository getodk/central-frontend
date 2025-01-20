import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class SelectNodeAnswer extends ValueNodeAnswer<SelectNode> {
	readonly stringValue: string;
	readonly value: readonly string[];

	constructor(node: SelectNode) {
		super(node);

		this.stringValue = node.currentState.instanceValue;
		this.value = node.currentState.value.slice();
	}

	override inspectValue(): JSONValue {
		return this.stringValue;
	}
}
