import type { SelectItem } from '@getodk/xforms-engine';

export class SelectChoice {
	constructor(protected readonly selectItem: SelectItem) {}

	getValue(): string {
		return this.selectItem.value;
	}
}
