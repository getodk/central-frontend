import type { SelectNode } from '@getodk/xforms-engine';
import { SelectChoice } from './SelectChoice.ts';

// TODO: we may end up wanting a general `List` type. I sure hope not!
export class SelectChoiceList implements Iterable<SelectChoice> {
	*[Symbol.iterator](): Iterator<SelectChoice> {
		const { valueOptions } = this.node.currentState;

		for (const index of valueOptions.keys()) {
			const option = this.get(index);

			if (option == null) {
				throw new Error(`Failed to iterate select item at index ${index}`);
			}

			yield option;
		}
	}

	constructor(readonly node: SelectNode) {}

	get(index: number): SelectChoice | null {
		const selectItem = this.node.currentState.valueOptions[index];

		if (selectItem == null) {
			return null;
		}

		return new SelectChoice(selectItem);
	}
}
