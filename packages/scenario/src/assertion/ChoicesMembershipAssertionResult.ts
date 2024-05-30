import { ComparableChoice } from '../choice/ComparableChoice.ts';
import type { CustomAssertionResult } from './CustomAssertionResult.ts';

// TODO: there may be a generalization around custom membership assertions to be
// had here, if that's needed by existing (or future) test suites.
type MembershipComparisonVerb = 'contain';
type MembershipComparisonVerbQualifier = 'in any order';

interface ChoicesMembershipAssertionResultOptions {
	readonly comparisonVerb: MembershipComparisonVerb;
	readonly comparisonVerbQualifier?: MembershipComparisonVerbQualifier | null;
}

export class ChoicesMembershipAssertionResult implements CustomAssertionResult {
	private assertionExpectedSingleChoice: boolean;

	readonly expectedChoices: readonly ComparableChoice[];
	readonly comparisonVerb: MembershipComparisonVerb;
	readonly comparisonVerbQualifier: MembershipComparisonVerbQualifier | null;

	constructor(
		expected: ComparableChoice | Iterable<ComparableChoice>,
		readonly actualChoices: readonly ComparableChoice[],
		readonly pass: boolean,
		options: ChoicesMembershipAssertionResultOptions
	) {
		this.actualChoices = Array.from(actualChoices);

		if (expected instanceof ComparableChoice) {
			this.assertionExpectedSingleChoice = true;
			this.expectedChoices = [expected];
		} else {
			this.assertionExpectedSingleChoice = false;
			this.expectedChoices = Array.from(expected);
		}

		this.comparisonVerb = options.comparisonVerb;
		this.comparisonVerbQualifier = options.comparisonVerbQualifier ?? null;
	}

	readonly message = (): string => {
		const { actualChoices, comparisonVerb, expectedChoices, assertionExpectedSingleChoice } = this;
		const actual = JSON.stringify(actualChoices.map((choice) => choice.inspectValue()));

		let expected: string;

		if (assertionExpectedSingleChoice) {
			expected = JSON.stringify(expectedChoices[0]?.inspectValue());
		} else {
			expected = JSON.stringify(
				expectedChoices.map((expectedChoice) => expectedChoice.inspectValue())
			);
		}

		return `Expected ${actual} to ${comparisonVerb} ${expected}`;
	};
}
