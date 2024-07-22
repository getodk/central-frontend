/**
 * Includes function implementation equivalents to several of JavaRosa's
 * `XFormsElement` static methods.
 */

/**
 * Escape < and > characters, specifically within attribute values. This is
 * intended, narrowly, to avoid failing tests where the only factor in failure
 * is an XPath expression with greater than/less than comparisons, as ported
 * without escaping from JavaRosa.
 *
 * As originally noted in `scenario` `secondary-instances.test.ts`, this is a
 * great example where we would benefit from using JSX for the XForm fixture DSL
 * (where escaping would be handled more generally as a serialization of the
 * structure we produce from JSX at compile time).
 */
const escapeAttributeValueXMLCharacters = (attributeValue: string) => {
	return attributeValue.replaceAll(/[<>]/g, (char) => {
		switch (char) {
			case '<':
				return '&lt;';

			case '>':
				return '&gt;';

			default:
				throw new Error(`Unexpected unescaped character: ${char}`);
		}
	})
}

export function buildAttributesString(attributes: ReadonlyMap<string, string>): string {
	const entries = Array.from(attributes.entries());

	return entries
		.map(([key, value]) => `${key}="${escapeAttributeValueXMLCharacters(value)}"`)
		.join(' ')
		.trim();
}
