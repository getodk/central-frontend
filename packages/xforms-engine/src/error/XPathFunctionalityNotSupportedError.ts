import type { XPathFunctionalityErrorCategory } from './XPathFunctionalityError.ts';
import { XPathFunctionalityError } from './XPathFunctionalityError.ts';

type XPathFunctionalityNotSupportedStub = () => never;

export class XPathFunctionalityNotSupportedError extends XPathFunctionalityError {
	static createStubImplementation(
		category: XPathFunctionalityErrorCategory
	): XPathFunctionalityNotSupportedStub {
		return () => {
			throw new this(category);
		};
	}

	private constructor(category: XPathFunctionalityErrorCategory) {
		super('XPath functionality not supported: ', category);
	}
}
