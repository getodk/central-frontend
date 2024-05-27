import { ComparableChoice } from './ComparableChoice.ts';

export class ExpectedChoice extends ComparableChoice {
	constructor(readonly selectItemValue: string) {
		super();
	}
}

export const choice = (value: string, _labelOrId?: string): ExpectedChoice => {
	return new ExpectedChoice(value);
};
