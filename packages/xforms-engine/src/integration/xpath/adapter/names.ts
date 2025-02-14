import {
	ENKETO_NAMESPACE_URI,
	ENKETO_PREFIX,
	FN_NAMESPACE_URI,
	FN_PREFIX,
	HTML_PREFIX,
	JAVAROSA_NAMESPACE_URI,
	JAVAROSA_PREFIX,
	ODK_NAMESPACE_URI,
	ODK_PREFIX,
	OPENROSA_XFORMS_NAMESPACE_URI,
	OPENROSA_XFORMS_PREFIX,
	XFORMS_NAMESPACE_URI,
	XFORMS_PREFIX,
	XHTML_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import { XPathFunctionalityNotSupportedError } from '../../../error/XPathFunctionalityNotSupportedError.ts';
import type { AnyStaticNode } from '../static-dom/StaticNode.ts';
import type { EngineXPathNode } from './kind.ts';

export const getEngineXPathNodeNamespaceURI = (node: EngineXPathNode): string | null => {
	switch (node.nodeType) {
		case 'primary-instance':
		case 'static-document':
		case 'static-text':
		case 'repeat-range:controlled':
		case 'repeat-range:uncontrolled':
			return null;

		case 'static-attribute':
		case 'static-element':
			return node.qualifiedName.namespaceURI?.href ?? null;

		default:
			return node.definition.qualifiedName.namespaceURI?.href ?? null;
	}
};

export const getEngineXPathNodeQualifiedName = (node: EngineXPathNode): string => {
	switch (node.nodeType) {
		case 'static-attribute':
		case 'static-element':
			return node.qualifiedName.getPrefixedName();

		case 'static-document':
		case 'static-text':
			return '';

		default:
			return node.definition.qualifiedName.getPrefixedName();
	}
};

export const getEngineXPathNodeLocalName = (node: EngineXPathNode): string => {
	switch (node.nodeType) {
		case 'static-attribute':
		case 'static-element':
			return node.qualifiedName.localName;

		case 'static-document':
		case 'static-text':
			return '';

		default:
			return node.definition.qualifiedName.localName;
	}
};

export const getEngineProcessingInstructionName =
	XPathFunctionalityNotSupportedError.createStubImplementation('processing-instruction');

/**
 * @todo in most cases we should not have **custom** namespace resolution from a
 * static node (e.g. external secondary instance, itext translation) context.
 * The main exception to that would be _XML external secondary instances_, which
 * of course can declare arbitrary namespaces on any arbitrary subtree, just
 * like a form definition's XML. In all other cases, we'd want to resolve a
 * prefix here from the _primary instance_ context. However, we don't (yet) have
 * access to the primary instance context from a static node. So we currently
 * fall back to the previous (incomplete/potentially wrong) default mapping.
 *
 * Note that this is relatively safe for the general case, and only potentially
 * wrong for:
 *
 * 1. Forms authored as XML, with arbitrary/non-default namespace declarations
 * 2. XML external secondary instances, also with arbitrary/non-default
 *    namespace declarations
 */
const resolveNamespaceURIFromStaticNodeContext = (_: AnyStaticNode, prefix: string | null) => {
	switch (prefix) {
		case null:
			return XFORMS_NAMESPACE_URI;

		case ENKETO_PREFIX:
			return ENKETO_NAMESPACE_URI;

		case FN_PREFIX:
			return FN_NAMESPACE_URI;

		case HTML_PREFIX:
			return XHTML_NAMESPACE_URI;

		case JAVAROSA_PREFIX:
			return JAVAROSA_NAMESPACE_URI;

		case ODK_PREFIX:
			return ODK_NAMESPACE_URI;

		case OPENROSA_XFORMS_PREFIX:
			return OPENROSA_XFORMS_NAMESPACE_URI;

		case XFORMS_PREFIX:
			return XFORMS_NAMESPACE_URI;

		default:
			return null;
	}
};

export const resolveEngineXPathNodeNamespaceURI = (
	node: EngineXPathNode,
	prefix: string | null
): string | null => {
	switch (node.nodeType) {
		case 'static-attribute':
		case 'static-document':
		case 'static-element':
		case 'static-text':
			return resolveNamespaceURIFromStaticNodeContext(node, prefix);

		case 'group':
		case 'input':
		case 'model-value':
		case 'note':
		case 'primary-instance':
		case 'range':
		case 'rank':
		case 'repeat-instance':
		case 'repeat-range:controlled':
		case 'repeat-range:uncontrolled':
		case 'root':
		case 'select':
		case 'subtree':
		case 'trigger':
		case 'upload':
			return node.definition.namespaceDeclarations.get(prefix)?.declaredURI?.href ?? null;
	}
};
