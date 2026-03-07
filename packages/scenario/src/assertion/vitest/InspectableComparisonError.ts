import { inspect } from './inspect.ts';
import type { Inspectable } from './shared-extension-types.ts';

interface InspectableComparisonErrorOptions {
	readonly comparisonQualifier?: string;
	readonly details?: string;
}

/**
 * Provides a general mechanism for reporting assertion failures in a consistent
 * format, for the general class of Vitest assertion extensions which fall into
 * a broad category of comparisons, where failure reports will tend to follow a
 * format of:
 *
 * > Expected $actual to $comparisonVerb $expected
 * > $comparisonQualifier? ...$details?
 */
export class InspectableComparisonError extends Error {
	constructor(
		actual: Inspectable,
		expected: Inspectable,
		comparisonVerb: string,
		options: InspectableComparisonErrorOptions = {}
	) {
		const { comparisonQualifier, details } = options;

		const messageParts = [
			'Expected',
			inspect(actual),
			'to',
			comparisonVerb,
			inspect(expected),
			comparisonQualifier,
			details,
		].filter((value): value is string => typeof value === 'string');

		super(messageParts.join(' '));
	}
}
