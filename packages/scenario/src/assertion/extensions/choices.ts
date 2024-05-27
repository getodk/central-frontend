import { assertInstanceType } from '@getodk/common/lib/runtime-types/instance-predicates.ts';
import { expect } from 'vitest';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';
import { ChoicesMembershipAssertionResult } from '../ChoicesMembershipAssertionResult.ts';
import type { CustomAssertionResult } from '../CustomAssertionResult.ts';

type ExtensionImplementation = (actual: unknown, expected: unknown) => CustomAssertionResult;

type MultipleChoiceMembershipComparison = (
	expected: Iterable<ComparableChoice>,
	actual: Iterable<ComparableChoice>
) => ChoicesMembershipAssertionResult;

interface ChoiceExtensionSignatures {
	readonly toContainChoices: MultipleChoiceMembershipComparison;
	readonly toContainChoicesInAnyOrder: MultipleChoiceMembershipComparison;
}

type ChoiceExtensionImplementations = {
	[K in keyof ChoiceExtensionSignatures]: ExtensionImplementation;
};

class UnknownError extends Error {
	constructor(readonly caughtNonError: unknown) {
		super('Caught unknown non-error value');
	}
}

const asError = (caught: unknown): Error => {
	if (caught instanceof Error) {
		return caught;
	}

	return new UnknownError(caught);
};

type AssertComparableChoicesArray = (
	value: unknown
) => asserts value is readonly ComparableChoice[];

const assertComparableChoicesArray: AssertComparableChoicesArray = (value) => {
	if (!Array.isArray(value)) {
		throw new Error('Not an array of choices');
	}

	for (const item of value) {
		assertInstanceType(ComparableChoice, item);
	}
};

const choiceExtensions = {
	toContainChoices: (actual: unknown, ...expected: unknown[]): CustomAssertionResult => {
		try {
			assertComparableChoicesArray(actual);
			assertComparableChoicesArray(expected);
		} catch (caught) {
			const error = asError(caught);

			return {
				pass: false,
				message: () => error.message,
			};
		}

		const actualChoices = Array.from(actual);
		const actualValues = actualChoices.map((choice) => {
			return choice.selectItemValue;
		});

		let previousIndex = -1;
		let pass = true;

		for (const choice of expected) {
			const currentIndex = actualValues.indexOf(choice.selectItemValue);

			if (currentIndex === -1 || currentIndex < previousIndex) {
				pass = false;

				break;
			}

			previousIndex = currentIndex;
		}

		return new ChoicesMembershipAssertionResult(expected, actualChoices, pass, {
			comparisonVerb: 'contain',
		});
	},

	toContainChoicesInAnyOrder: (actual: unknown, ...expected: unknown[]): CustomAssertionResult => {
		try {
			assertComparableChoicesArray(actual);
			assertComparableChoicesArray(expected);
		} catch (caught) {
			const error = asError(caught);

			return {
				pass: false,
				message: () => error.message,
			};
		}

		const actualChoices = Array.from(actual);
		const actualValues = actualChoices.map((choice) => {
			return choice.selectItemValue;
		});

		const pass = Array.from(expected).every((choice) => {
			return actualValues.includes(choice.selectItemValue);
		});

		return new ChoicesMembershipAssertionResult(expected, actualChoices, pass, {
			comparisonVerb: 'contain',
			comparisonVerbQualifier: 'in any order',
		});
	},
} as const satisfies ChoiceExtensionImplementations;

interface ChoiceExtensions<R = unknown> {
	readonly toContainChoices: (...choices: ComparableChoice[]) => R;
	readonly toContainChoicesInAnyOrder: (...choices: ComparableChoice[]) => R;
}

expect.extend(choiceExtensions);

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends ChoiceExtensions<T> {}
	interface AsymmetricMatchersContaining extends ChoiceExtensions {}
}
