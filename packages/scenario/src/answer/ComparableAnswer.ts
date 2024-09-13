import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { Scenario } from '../jr/Scenario.ts';

interface OptionalBooleanComparable {
	// Expressed here so it can be overridden as either a `readonly` property or
	// as a `get` accessor
	readonly booleanValue?: boolean;
}

/**
 * Provides a common interface for comparing "answer" values of arbitrary data
 * types, where the answer may be obtained from:
 *
 * - "Questions" (i.e. the {@link Scenario} representation of value nodes)
 * - Expected values expressed in test assertions
 *
 * This interface is used to support evaluation of assertions, where their
 * JavaRosa expression has been adapted to the closest equivalent in Vitest's
 * {@link https://vitest.dev/api/expect.html | built-in} or
 * {@link https://vitest.dev/guide/extending-matchers.html | extended}
 * assertions/matchers.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- see OptionalBooleanComparable.booleanValue
export abstract class ComparableAnswer implements OptionalBooleanComparable {
	abstract get stringValue(): string;

	// To be overridden
	equals(
		// @ts-expect-error -- part of the interface to be overridden
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		answer: ComparableAnswer
	): SimpleAssertionResult | null {
		return null;
	}

	/**
	 * Note: we currently return {@link stringValue} here, but this probably
	 * won't last as we expand support for other data types. This is why the
	 * return type is currently `unknown`.
	 */
	getValue(): unknown {
		return this.stringValue;
	}

	inspectValue(): JSONValue {
		return this.stringValue;
	}

	toString(): string {
		return this.stringValue;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- see OptionalBooleanComparable.booleanValue
export interface ComparableAnswer extends OptionalBooleanComparable {}
