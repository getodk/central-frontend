import type { XPathFunctionalityErrorCategory } from './XPathFunctionalityError.ts';
import { XPathFunctionalityError } from './XPathFunctionalityError.ts';

type XPathFunctionalityPendingStub = () => never;

export class XPathFunctionalityPendingError extends XPathFunctionalityError {
	static createStubImplementation(
		category: XPathFunctionalityErrorCategory
	): XPathFunctionalityPendingStub {
		return () => {
			throw new this(category);
		};
	}

	private constructor(category: XPathFunctionalityErrorCategory) {
		super('XPath functionality pending: ', category);
	}
}
