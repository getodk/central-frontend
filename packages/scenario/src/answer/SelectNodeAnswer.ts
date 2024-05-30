import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import { ValueNodeAnswer } from './ValueNodeAnswer.ts';

export class SelectNodeAnswer extends ValueNodeAnswer<SelectNode> {
	/**
	 * @todo There probably should be some means to get this from the engine, but
	 * we should be careful not to incentivize clients attempting to reproduce
	 * engine behavior with it.
	 */
	get stringValue(): string {
		return this.itemValues().join(' ');
	}

	private itemValues(): readonly string[] {
		return this.node.currentState.value.map((item) => item.value);
	}

	override inspectValue(): JSONValue {
		return this.itemValues();
	}
}
