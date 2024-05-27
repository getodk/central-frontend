import type { SelectItem } from '@getodk/xforms-engine';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';

export class SelectChoice extends ComparableChoice {
	get value(): string {
		return this.selectItem.value;
	}

	get label(): string | null {
		return this.selectItem.label?.asString ?? null;
	}

	constructor(protected readonly selectItem: SelectItem) {
		super();
	}

	getValue(): string {
		return this.value;
	}
}
