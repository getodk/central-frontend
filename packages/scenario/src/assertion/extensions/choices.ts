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

type AssertItem<T> = (value: unknown) => asserts value is T;

type AssertItems = <T>(
	assertItem: AssertItem<T>,
	items: readonly unknown[]
) => asserts items is readonly T[];

const assertItems: AssertItems = <T>(
	assertItem: AssertItem<T>,
	items: readonly unknown[]
): asserts items is readonly T[] => {
	for (const item of items) {
		assertItem(item);
	}
};

const assertComparableChoice = (value: unknown): asserts value is ComparableChoice => {
	assertInstanceType(ComparableChoice, value);
};

const toComparableChoicesArray = (value: unknown): readonly ComparableChoice[] => {
	const maybeIterable = value as Iterable<unknown> | null | undefined;

	if (maybeIterable == null || typeof maybeIterable[Symbol.iterator] !== 'function') {
		throw new Error('Not an Iterable<ComparableChoice>');
	}

	const array = Array.from(maybeIterable);

	assertItems(assertComparableChoice, array);

	return array;
};

const choiceExtensions = {
	toContainChoices: (actual: unknown, ...expected: unknown[]): CustomAssertionResult => {
		const actualChoices = toComparableChoicesArray(actual);
		const actualValues = actualChoices.map((choice) => {
			return choice.selectItemValue;
		});
		const expectedChoices = toComparableChoicesArray(expected);

		let previousIndex = -1;
		let pass = true;

		for (const choice of expectedChoices) {
			const currentIndex = actualValues.indexOf(choice.selectItemValue);

			if (currentIndex === -1 || currentIndex < previousIndex) {
				pass = false;

				break;
			}

			previousIndex = currentIndex;
		}

		return new ChoicesMembershipAssertionResult(expectedChoices, actualChoices, pass, {
			comparisonVerb: 'contain',
		});
	},

	toContainChoicesInAnyOrder: (actual: unknown, ...expected: unknown[]): CustomAssertionResult => {
		const actualChoices = toComparableChoicesArray(actual);
		const actualValues = actualChoices.map((choice) => {
			return choice.selectItemValue;
		});
		const expectedChoices = toComparableChoicesArray(expected);

		const pass = expectedChoices.every((choice) => {
			return actualValues.includes(choice.selectItemValue);
		});

		return new ChoicesMembershipAssertionResult(expectedChoices, actualChoices, pass, {
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
