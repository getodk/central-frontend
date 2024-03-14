import type { Accessor } from 'solid-js';
import type { LabelDefinition } from '../../body/text/LabelDefinition.ts';
import type { ValueNodeState } from '../ValueNodeState.ts';

interface SelectStateItemOptions {
	readonly contextNode: Node;
}

export class SelectStateItem {
	readonly label: Accessor<string>;

	constructor(
		state: ValueNodeState,
		readonly value: string,
		label: LabelDefinition | null,
		options: SelectStateItemOptions = { contextNode: state.node }
	) {
		if (label == null) {
			this.label = () => value;
		} else {
			this.label = state.createTextEvaluation(label, options);
		}
	}
}
