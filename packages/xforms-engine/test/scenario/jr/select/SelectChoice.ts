import type { SelectItem } from '@getodk/xforms-engine';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';

export class SelectChoice extends ComparableChoice {
	readonly value: string;
	readonly properties: Array<[string, string]>;

	get label(): string {
		return this.selectItem.label.asString;
	}

	constructor(protected readonly selectItem: SelectItem) {
		super();

		this.value = selectItem.value;
		this.properties = selectItem.properties;
	}

	getProperties(): Array<[string, string]> {
		return this.properties;
	}

	getValue(): string {
		return this.value;
	}
}
