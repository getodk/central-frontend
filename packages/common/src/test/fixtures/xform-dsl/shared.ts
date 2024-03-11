/**
 * Includes function implementation equivalents to several of JavaRosa's
 * `XFormsElement` static methods.
 */

export function buildAttributesString(attributes: ReadonlyMap<string, string>): string {
	const entries = Array.from(attributes.entries());

	return entries
		.map(([key, value]) => `${key}="${value}"`)
		.join(' ')
		.trim();
}
