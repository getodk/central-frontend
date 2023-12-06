import { expect } from 'vitest';
import { castToString } from './cast.ts';

interface Matcher {
	assertMatch(actual: unknown): void;
}

class IsMatcher implements Matcher {
	protected readonly value: string;

	constructor(value: unknown) {
		this.value = castToString(value);
	}

	assertMatch(actual: unknown): void {
		expect(actual).toBe(this.value);
	}
}

export class CoreMatchers {
	static is(expected: ExpectedAnswer): Matcher {
		return new IsMatcher(expected);
	}
}

abstract class ExpectedAnswer {
	protected abstract readonly value: string;

	toString(): string {
		return this.value;
	}
}

class IntAnswer extends ExpectedAnswer {
	protected readonly value: string;

	constructor(value: bigint | number) {
		super();

		const intValue = Math.trunc(Number(value));

		if (intValue !== value) {
			throw new Error(`Not an integer: ${value}`);
		}

		this.value = castToString(value);
	}
}

export const intAnswer = (value: bigint | number): IntAnswer => new IntAnswer(value);

class StringAnswer extends ExpectedAnswer {
	protected readonly value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export const stringAnswer = (value: string): StringAnswer => new StringAnswer(value);

export const assertThat = (value: unknown, matcher: Matcher) => {
	matcher.assertMatch(value);
};
