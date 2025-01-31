import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { RankNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class RankNodeAnswer extends ValueNodeAnswer<RankNode> {
	readonly stringValue: string;
	readonly value: readonly string[];

	constructor(node: RankNode) {
		super(node);

		this.stringValue = node.currentState.instanceValue;
		this.value = node.currentState.value;
	}

	override inspectValue(): JSONValue {
		return this.stringValue;
	}
}
