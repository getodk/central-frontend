import type {
	CustomInspectable,
	DeriveStaticVitestExpectExtension,
} from '@getodk/common/test/assertions/helpers.ts';
import {
	AsymmetricTypedExpectExtension,
	InspectableComparisonError,
	extendExpect,
	instanceArrayAssertion,
	instanceAssertion,
} from '@getodk/common/test/assertions/helpers.ts';
import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import { expect } from 'vitest';
import { ComparableChoice } from '../../choice/ComparableChoice.ts';
import { ExpectedChoice } from '../../choice/ExpectedChoice.ts';
import { SelectChoiceList } from '../../jr/select/SelectChoiceList.ts';

const assertSelectList = instanceAssertion(SelectChoiceList);
const assertExpectedChoicesArray = instanceArrayAssertion(ExpectedChoice);

type SelectChoices = Iterable<ComparableChoice>;

const mapChoices = <Key extends keyof ComparableChoice>(
	choices: SelectChoices,
	key: Key
): ReadonlyArray<ComparableChoice[Key]> => {
	return Array.from(choices).map((choice) => choice[key]);
};

class InspectableChoices implements CustomInspectable {
	readonly choices: readonly ComparableChoice[];

	constructor(choices: SelectChoices) {
		this.choices = Array.from(choices);
	}

	inspectValue(): JSONValue {
		return this.choices.map((choice) => choice.inspectValue());
	}
}

interface GetContainsChoicesResultOptions {
	readonly inAnyOrder: boolean;
}

const getContainsChoicesResult = (
	actual: SelectChoiceList,
	expected: readonly ExpectedChoice[],
	options: GetContainsChoicesResultOptions
): InspectableComparisonError | true => {
	const actualChoices = Array.from(actual);
	const actualIndexes = expected.map((expectedChoice) => {
		return actualChoices.findIndex((actualChoice) => {
			return expectedChoice.checkEquality(actualChoice).pass;
		});
	});
	const missingChoices = actualIndexes.flatMap((actualIndex, expectedIndex) => {
		if (actualIndex === -1) {
			return expected[expectedIndex]!;
		}

		return [];
	});

	const { inAnyOrder } = options;
	const baseErrorOptions = inAnyOrder ? { comparisonQualifier: 'in any order' } : {};

	let error: InspectableComparisonError | null = null;

	if (missingChoices.length > 0) {
		const missing = mapChoices(missingChoices, 'comparableValue');

		error = new InspectableComparisonError(
			new InspectableChoices(actual),
			new InspectableChoices(expected),
			'contain',
			{
				...baseErrorOptions,
				details: `Missing choices: ${JSON.stringify(missing)}`,
			}
		);
	} else if (!inAnyOrder) {
		const isExpectedOrder = actualIndexes.every((actualIndex, i) => {
			const previousIndex = actualIndexes[i - 1];

			return previousIndex == null || actualIndex > previousIndex;
		});

		if (!isExpectedOrder) {
			error = new InspectableComparisonError(
				new InspectableChoices(actual),
				new InspectableChoices(expected),
				'contain',
				{
					...baseErrorOptions,
					details: `Choices match in unexpected order: ${JSON.stringify(actualIndexes)}`,
				}
			);
		}
	}

	return error == null || error;
};

const choiceExtensions = extendExpect(expect, {
	toContainChoices: new AsymmetricTypedExpectExtension(
		assertSelectList,
		assertExpectedChoicesArray,
		(actual, expected) => {
			return getContainsChoicesResult(actual, expected, {
				inAnyOrder: false,
			});
		}
	),

	/**
	 * **NOTE FOR REVIEWERS**
	 *
	 * This could really go on any of the custom assertion extensions. But it's
	 * going here, because here is where I experienced the wonder that prompted me
	 * to write it.
	 *
	 * The general approach to custom assertion extensions felt a bit
	 * overengineered as I was working on it. It simplifies and clarifies a few
	 * things that felt confusing without a more purposeful abstraction, but it
	 * could have been plenty good enough to just reference the docs, talk about
	 * it, otherwise build a shared understanding of the Vitest extension API's
	 * inherent complexities.
	 *
	 * I realized today that, entirely by lucky accident, this solution is so much
	 * better than that. And I realized it because, again entirely by lucky
	 * accident, I discovered that command-clicking (or otherwise using IDE
	 * navigation) from an actual call to the assertion in any random test...
	 * comes right back to this implementation. In hindsight, of course it does.
	 * But that's a thing we'd give up without a little bit of extra abstraction
	 * on top of Vitest, and it's a thing I think we'll find quite valuable if we
	 * also find custom domain-specific assertions valuable for their
	 * expressiveness in tests.
	 */
	toContainChoicesInAnyOrder: new AsymmetricTypedExpectExtension(
		assertSelectList,
		assertExpectedChoicesArray,
		(actual, expected) => {
			return getContainsChoicesResult(actual, expected, {
				inAnyOrder: true,
			});
		}
	),
});

type ChoiceExtensions = typeof choiceExtensions;

declare module 'vitest' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends DeriveStaticVitestExpectExtension<ChoiceExtensions, T> {}
	interface AsymmetricMatchersContaining
		extends DeriveStaticVitestExpectExtension<ChoiceExtensions> {}
}
