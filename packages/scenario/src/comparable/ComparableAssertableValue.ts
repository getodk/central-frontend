import type { SimpleAssertionResult } from '@getodk/common/test/assertions/vitest/shared-extension-types.ts';
import type { JSONValue } from '@getodk/common/types/JSONValue.ts';
import type { Scenario } from '../jr/Scenario.ts';

interface OptionalBooleanComparable {
	// Expressed here so it can be overridden as either a `readonly` property or
	// as a `get` accessor
	readonly booleanValue?: boolean;
}

/**
 * Provides a common interface for comparing values of arbitrary data types, to
 * support specialized comparison logic between values produced by
 * {@link Scenario} and the expected values asserted against those.
 *
 * Example use cases include asserting expected values for:
 *
 * - "Answers" (the {@link Scenario} concept, as read from "questions")
 * - Serialized XML (where we may elide certain formatting differences, such as
 *   length of whitespace, or whether an empty element is self-closed)
 *
 * This interface is used to support evaluation of assertions, where their
 * JavaRosa expression has been adapted to the closest equivalent in Vitest's
 * {@link https://vitest.dev/api/expect.html | built-in} or
 * {@link https://vitest.dev/guide/extending-matchers.html | extended}
 * assertions/matchers.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging -- see OptionalBooleanComparable.booleanValue
export abstract class ComparableAssertableValue implements OptionalBooleanComparable {
	abstract get stringValue(): string;

	// To be overridden
	equals(
		// @ts-expect-error -- part of the interface to be overridden
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		other: ComparableAssertableValue
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
export interface ComparableAssertableValue extends OptionalBooleanComparable {}
