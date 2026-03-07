/**
 * Corresponds to the portions of JavaRosa's `XFormsElement` which don't
 * include a default implementation, and which are the explicit interface
 * that implementations must provide.
 */
export interface XFormsElement {
	getName(): string;
	asXml(): string;
}
