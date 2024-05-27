import type { SelectNode } from '@getodk/xforms-engine';
import { SelectChoice } from './SelectChoice.ts';

// TODO: we may end up wanting a general `List` type. I sure hope not!
export class SelectChoiceList {
	constructor(readonly node: SelectNode) {}

	get(index: number): SelectChoice | null {
		const selectItem = this.node.currentState.valueOptions[index];

		if (selectItem == null) {
			return null;
		}

		return new SelectChoice(selectItem);
	}
}
