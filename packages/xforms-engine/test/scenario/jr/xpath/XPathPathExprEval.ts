import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';
import type { JREvaluationContext } from './JREvaluationContext.ts';
import type { JRTreeReference } from './JRTreeReference.ts';
import type { JRXPathNodeset } from './JRXPathNodeset.ts';

/**
 * **PORTING NOTES**
 *
 * This is currently a stub of the class and methods of the same name/shape in
 * —and as called within tests ported from—JavaRosa. The constructor will
 * produce a valid instance, but calls to any of its methods will throw a
 * runtime error.
 *
 * From a testing perspective, this class is understood to be used in assertions
 * about certain aspects of implementation detail, corresponding to concepts we
 * don't expose in the engine/client interface nor expect to expose in the
 * foreseeable future.
 *
 * Where possible, ported tests which depend on instances of this class will be
 * accompanied by a supplemental test addressing aspects of those tests which
 * are clearly transferrable to more pertinent client-facing APIs.
 */
export class XPathPathExprEval {
	eval(_treeReference: JRTreeReference, _evaluationContext: JREvaluationContext): JRXPathNodeset {
		throw new UnclearApplicabilityError('exposure of XPath evaluation implementation details');
	}
}
