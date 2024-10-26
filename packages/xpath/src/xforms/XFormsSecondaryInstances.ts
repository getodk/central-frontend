import type { XPathNode } from '../temp/dom-abstraction.ts';
import type { XFormsElementRepresentation } from './XFormsElementRepresentation.ts';

export type XFormsSecondaryInstanceElement<T extends XPathNode> = XFormsElementRepresentation<
	T,
	'instance',
	'id'
>;

export type XFormsSecondaryInstanceMap<T extends XPathNode> = ReadonlyMap<
	string,
	XFormsSecondaryInstanceElement<T>
>;
