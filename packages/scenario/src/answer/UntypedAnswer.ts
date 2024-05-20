import type { Scenario } from '../jr/Scenario.ts';
import { ComparableAnswer } from './ComparableAnswer.ts';

interface MaybeStringable {
	toString?(): string;
}

const STRINGABLE_BRAND = Symbol('STRINGABLE');

interface Stringable {
	// ... otherwise `isStringable` doesn't actually narrow the type...
	[STRINGABLE_BRAND]?: true;

	toString(): string;
}

const isExplicitlyCastableToString = (value: unknown): value is Stringable => {
	return typeof (value as MaybeStringable).toString === 'function';
};

/**
 * **PORTING NOTES**
 *
 * Initial thoughts (preserved intact for posterity, edited to strike the last
 * bit which now feels less clear):
 *
 * > This was previously implemented as a `castToString` function. Its call site
 * > suggested that this casting didn't belong in the test interface, instead
 * > perhaps belonging in the engine. That seems less likely now, as the client
 * > interface has intentionally evolved to associate specific runtime value
 * > encodings with a given node type; these runtime encoding types are not now,
 * > nor planned to be, mapped to JavaRosa's equivalents (if/when those exist).
 * > So it seems likely this is actually a more stable way to handle bridging
 * > the `Scenario` interface (presently its `answer` method, possibly more to
 * > come?) than trying to convolute such casting into the design of the
 * > engine's client interface directly. ~~This is only presented as a `@todo`
 * > to draw attention in review. If we agree on this reasoning, we can likely
 * > revise this comment to remove reference to the previous reasoning and
 * > remove that `@todo` tag.~~
 *
 * Further thought on reflection of some surprises in the first
 * `relevant`-focused test ported from `TriggerableDagTest.java`:
 *
 * While exploring some of the contours of the test's failure modes, it became
 * more clear that there are a few intersecting concerns that we'll need to
 * address at least in the engine interface, and which have implications for
 * if/how we handle casting in `scenario` (whether in JavaRosa ported tests, or
 * future tests using pertinent aspects of the same {@link Scenario} interface):
 *
 * - Evaluating an XPath expression to `boolean` has slightly different
 *   semantics in [ODK] XForms than in XPath alone: a bound node's `<bind type>`
 *   is expected to influence casting behavior of reads, at least within certain
 *   semantic contexts (like `relevant`). This is discussed in more detail in
 *   porting notes on the test itself; these notes are added to ensure that we
 *   don't lose track of the implications in the next point...
 *
 * - A bound node's `<bind type>` **may** be expected to influence casting when
 *   writing values to those bound nodes, though that may turn out to be moot
 *   when the read semantics are sufficiently addressed. We'll certainly have
 *   more clarity on the point as we address the pertinent features and any
 *   associated defects. In any case, this abstraction now feels less like a
 *   "sure thing" as a consequence of that.
 *
 * - A brief local exploration, not included in this commit, revealed that
 *   slightly modifying the test in question to produce semantics closer to
 *   XPath **still implicated** `<bind type>`-specific casting as a potential
 *   concern, particularly around falsy values (which is to be expected, because
 *   XPath `boolean` casting semantics are themselves complex).
 */
export class UntypedAnswer extends ComparableAnswer {
	constructor(readonly unknownValue: unknown) {
		super();
	}

	get stringValue(): string {
		const { unknownValue } = this;

		if (unknownValue instanceof ComparableAnswer) {
			return unknownValue.stringValue;
		}

		switch (typeof unknownValue) {
			case 'string':
			case 'number':
			case 'bigint':
				return String(unknownValue);

			case 'boolean':
				return unknownValue ? '1' : '0';

			case 'undefined':
			case 'object':
				if (unknownValue == null) {
					return '';
				}

				if (isExplicitlyCastableToString(unknownValue)) {
					return unknownValue.toString();
				}

				break;
		}

		throw new Error('Could not cast answer to string');
	}
}
