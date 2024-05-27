import { ComparableChoice } from './ComparableChoice.ts';

export class ExpectedChoice extends ComparableChoice {
	get label(): string | null {
		return this.labelOrId;
	}

	constructor(
		readonly value: string,
		protected readonly labelOrId: string | null = null
	) {
		super();
	}
}

export const choice = (value: string, labelOrId?: string): ExpectedChoice => {
	return new ExpectedChoice(value, labelOrId ?? null);
};
