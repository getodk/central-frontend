import type { NamespaceDeclaration } from './NamespaceDeclaration.ts';

/**
 * Convenience wrapper to represent an XML namespace URI as a {@link URL}. This
 * representation is used/responsible for:
 *
 * - normalized logic for XML semantics around special namespace URI values, in
 *   particular for consistent handling of the "null namespace" (input for such
 *   is accepted as either an empty string or `null`)
 * - validation of input: a non-"null namespace" value will be rejected if it is
 *   not a valid URI string
 * - type-level distinction between a namespace URI and a
 *   {@link NamespaceDeclaration.declaredPrefix | namespace declaration's prefix},
 *   as an aide to avoid using one in place of the other as e.g. a positional
 *   argument
 *
 * @todo Test the finer distinctions between "URL" and "URI"!
 *
 * @todo Probably not a huge deal in the scheme of things, but this is almost
 * entirely pure overhead at runtime! The "validation" use case is kind of a
 * stretch, and may well be wrong. The type-level distinction from a namespace
 * prefix, however, has proved useful **quite a few times** during iteration of
 * this change. If we can actually measure an impact, it might be worth instead
 * considering "branded types" for the type-level distinct (in which case we
 * could use a factory function to handle both the branding and special XML
 * semantics).
 */
export class NamespaceURL extends URL {
	static from(namespaceURI: NamespaceURL | string | null): NamespaceURL | null {
		if (namespaceURI == null || namespaceURI === '') {
			return null;
		}

		return new this(String(namespaceURI));
	}

	override readonly href: string;

	private constructor(href: string) {
		super(href);

		this.href = href;
	}
}
