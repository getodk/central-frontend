import type { AnyFunction, ExpandUnion } from '@getodk/common/types/helpers.js';
import type { XPathDOMAdapter, XPathNode } from '@getodk/xpath';

/**
 * @todo this is general enough to go in `@getodk/common`. Holding off until
 * it's clear we actually benefit from this particular type gymnastic.
 */
// prettier-ignore
type MethodNameOf<T> = {
	[K in keyof T]:
		T[K] extends AnyFunction
			? K
			: never;
}[keyof T];

// prettier-ignore
export type XPathFunctionalityErrorCategory = ExpandUnion<
	| MethodNameOf<XPathDOMAdapter<XPathNode>>
	| 'processing-instruction'
>;

export abstract class XPathFunctionalityError extends Error {
	constructor(functionalityMessagePrefix: string, category: XPathFunctionalityErrorCategory) {
		super(`${functionalityMessagePrefix}${category}`);
	}
}
