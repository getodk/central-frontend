import type {
	DeriveStaticVitestExpectExtension,
	Inspectable,
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
import { SelectChoiceList } from '../../jr/select/SelectChoiceList.ts';

const assertSelectList = instanceAssertion(SelectChoiceList);
const assertChoicesArray = instanceArrayAssertion(ComparableChoice);

type SelectChoices = Iterable<ComparableChoice>;

const mapChoices = <Key extends keyof ComparableChoice>(
	choices: SelectChoices,
	key: Key
): ReadonlyArray<ComparableChoice[Key]> => {
	return Array.from(choices).map((choice) => choice[key]);
};

class InspectableChoices implements Inspectable {
	readonly choices: readonly ComparableChoice[];

	constructor(choices: SelectChoices) {
		this.choices = Array.from(choices);
	}

	inspectValue(): JSONValue {
		return this.choices.map((choice) => choice.inspectValue());
	}
}

const choiceExtensions = extendExpect(expect, {
	toContainChoices: new AsymmetricTypedExpectExtension(
		assertSelectList,
		assertChoicesArray,
		(actual, expected) => {
			const actualChoices = mapChoices(actual, 'comparableValue');
			const expectedChoices = mapChoices(expected, 'comparableValue');
			const missing: string[] = [];
			const outOfOrder: string[] = [];

			let previousIndex = -1;

			for (const value of expectedChoices) {
				const valueIndex = actualChoices.indexOf(value);

				if (valueIndex === -1) {
					missing.push(value);
					continue;
				} else if (valueIndex < previousIndex) {
					outOfOrder.push(value);
				}

				previousIndex = valueIndex;
			}

			const pass = missing.length === 0 && outOfOrder.length === 0;

			return (
				pass ||
				new InspectableComparisonError(
					new InspectableChoices(actual),
					new InspectableChoices(expected),
					'contain',
					{
						details: `Missing choices: ${JSON.stringify(missing)}\nChoices out of order: ${JSON.stringify(outOfOrder)}`,
					}
				)
			);
		}
	),
	toContainChoicesInAnyOrder: new AsymmetricTypedExpectExtension(
		assertSelectList,
		assertChoicesArray,
		(actual, expected) => {
			const actualValues = mapChoices(actual, 'comparableValue');
			const expectedValues = mapChoices(expected, 'comparableValue');
			const missingValues: string[] = [];

			for (const value of expectedValues) {
				if (!actualValues.includes(value)) {
					missingValues.push(value);
				}
			}

			const pass = missingValues.length === 0;

			return (
				pass ||
				new InspectableComparisonError(
					new InspectableChoices(actual),
					new InspectableChoices(expected),
					'contain',
					{
						comparisonQualifier: 'in any order',
						details: `Missing choices: ${JSON.stringify(missingValues)}`,
					}
				)
			);
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
