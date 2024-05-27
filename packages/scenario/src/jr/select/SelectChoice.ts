import type { SelectItem } from '@getodk/xforms-engine';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';

export class SelectChoice extends ComparableChoice {
	readonly selectItemValue: string;

	constructor(protected readonly selectItem: SelectItem) {
		super();

		this.selectItemValue = selectItem.value;
	}

	getValue(): string {
		return this.selectItemValue;
	}
}
