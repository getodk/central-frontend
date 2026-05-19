import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import type { resolveDependencyNodesets } from './dependency-analysis.ts';
import { resolvePath, serializeNodesetReference } from './path-resolution.ts';
import { getPathExpressionNode } from './semantic-analysis.ts';

/**
 * Resolves a (potentially relative) `nodeset` reference, to its context (if one
 * is available). This is a slight variation on the dependency analysis behavior
 * of {@link resolveDependencyNodesets}, different in the following ways:
 *
 * - Output is the resolved input expression, rather than sub-expressions
 *   identified within it
 *
 * - Output expression preserves Predicates
 *
 * The purprose of these differences is to generalize resolution of a form
 * definition's direct `nodeset` references, where they may be...
 *
 * - defined relative to some contextual aspect of the form (e.g. `<group
 *   ref="/data/some-absolute-grp"><input ref="some-child">`)
 *
 * - a more complex `nodeset` expression (e.g. `<itemset nodeset>`) which may
 *   also lack context in the original form definition, but which may itself
 *   contain predicates defining specific form behavior
 */
const resolveParsedNodesetReference = (
	contextReference: string | null,
	reference: string
): string => {
	const referenceNode = getPathExpressionNode(reference);

	if (referenceNode == null) {
		return reference;
	}

	const contextNode = contextReference == null ? null : getPathExpressionNode(contextReference);
	const resolved = resolvePath(contextNode, referenceNode);

	return serializeNodesetReference(resolved, {
		stripPredicates: false,
	});
};

interface ReferenceParsingContext {
	readonly reference: string | null;
	readonly parent?: ReferenceParsingContext | null;
}

type ReferenceAttributeName = PartiallyKnownString<'nodeset' | 'ref'>;

interface KnownAttributeElement<AttributeName extends string> extends Element {
	getAttribute(name: AttributeName): string;
	getAttribute(name: string): string | null;
}

type ParsedReferenceAttribute<T extends Element, AttributeName extends string> =
	T extends KnownAttributeElement<AttributeName> ? string : string | null;

/**
 * Parses a `nodeset` reference from an arbitrary form definition element, and
 * resolves that (potentially relative) reference to the provided context.
 */
export const parseNodesetReference = <
	const AttributeName extends ReferenceAttributeName,
	T extends Element | KnownAttributeElement<AttributeName>,
>(
	parentContext: ReferenceParsingContext,
	element: T,
	attributeName: AttributeName
): ParsedReferenceAttribute<T, AttributeName> => {
	const referenceExpression = element.getAttribute(attributeName);

	if (referenceExpression == null) {
		return referenceExpression as ParsedReferenceAttribute<T, AttributeName>;
	}

	let currentContext: ReferenceParsingContext | null = parentContext;
	let parentReference: string | null = parentContext.reference;

	while (currentContext != null && parentReference == null) {
		parentReference = currentContext?.parent?.reference ?? null;
		currentContext = currentContext.parent ?? null;
	}

	if (parentReference == null) {
		return referenceExpression;
	}

	return resolveParsedNodesetReference(parentReference, referenceExpression);
};
