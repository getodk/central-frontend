import type { JavaUtilList } from '../../java/util/List.ts';
import type { JRTreeReference } from './JRTreeReference.ts';
import type { XPathPathExprEval } from './XPathPathExprEval.ts';

/**
 * Not currently implemented. Types are provided to represent certain
 * implementation details exercised in tests ported from JavaRosa, with the
 * intent that those tests should pass a type check even where they'd otherwise
 * be skipped (or otherwise expected to fail for reasons not related to
 * implementation detail-specific assertions).
 *
 * This interface corresponds to JavaRosa's class named `XPathNodeset`, here
 * prefixed with `JR` to preemptively disambiguate any usage of the name in web
 * forms internals (for instance, within `@getodk/xpath`, where the name could
 * reasonably be expected to find use).
 *
 * @see {@link XPathPathExprEval} for additional details.
 */
export interface JRXPathNodeset {
	getReferences(): JavaUtilList<JRTreeReference>;
	size(): number;
}
