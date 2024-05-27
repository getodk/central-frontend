import type { JSONValue } from '@getodk/common/types/JSONValue.ts';

export abstract class ComparableChoice {
	abstract selectItemValue: string;

	inspectValue(): JSONValue {
		return this.selectItemValue;
	}

	toString(): string {
		return this.selectItemValue;
	}
}
