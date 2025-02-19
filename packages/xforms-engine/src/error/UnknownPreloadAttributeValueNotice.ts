type PreloadAttributeName = 'jr:preload' | 'jr:preloadParams';

/**
 * @todo This class is intentionally named to reflect the fact that it is not
 * intended to indefinitely block loading a form! Insofar as we currently throw
 * this error, the intent is to determine whether we have gaps in our support
 * for
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | preload attributes}.
 *
 * @todo Open question(s) for design around the broader error production story:
 * how should we design for conditions which are _optionally errors_ (e.g.
 * varying levels of strictness, use case-specific cases where certain kinds of
 * errors aren't failures)? In particular, how should we design for:
 *
 * - Categorization that allows selecting which error conditions are applied, at
 *   what level of severity?
 * - Blocking progress on failure-level severity, proceeding on sub-failure
 *   severity?
 *
 * Question applies to this case where we may want to error for unknown preload
 * attribute values in dev/test, but may not want to error under most (all?)
 * user-facing conditions.
 */
export class UnknownPreloadAttributeValueNotice extends Error {
	constructor(
		attributeName: PreloadAttributeName,
		expectedValues: ReadonlyArray<string | null>,
		unknownValue: string | null
	) {
		const expected = expectedValues.map((value) => JSON.stringify(value)).join(', ');
		super(
			`Unknown ${attributeName} value. Expected one of ${expected}, got: ${JSON.stringify(unknownValue)}`
		);
	}
}
