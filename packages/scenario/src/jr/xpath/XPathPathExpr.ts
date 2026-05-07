import { UnclearApplicabilityError } from '../../error/UnclearApplicabilityError.ts';
import type { JREvaluationContext } from './JREvaluationContext.ts';
import type { JRTreeReference } from './JRTreeReference.ts';

/**
 * @todo Hopefully we can keep this interface extremely minimal. It currently
 * exists only to allow tests calling into it to type check.
 */
export class XPathPathExpr {
	static getRefValue(_model: unknown, _ec: JREvaluationContext, _ref: JRTreeReference): string {
		throw new UnclearApplicabilityError('exposure of XPath evaluation implementation details');
	}
}
