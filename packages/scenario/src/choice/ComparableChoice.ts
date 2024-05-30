import type { JSONValue } from '@getodk/common/types/JSONValue.ts';

export abstract class ComparableChoice {
	abstract get value(): string;
	abstract get label(): string | null;

	get comparableValue(): string {
		return JSON.stringify(this.inspectValue());
	}

	inspectValue(): JSONValue {
		const { label, value } = this;

		if (label == null) {
			return { value };
		}

		return { label, value };
	}

	toString(): string {
		return this.value;
	}
}
