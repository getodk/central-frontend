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
import type { InstanceNode } from '../../../instance/abstract/InstanceNode.ts';
import type { StaticNode } from '../static-dom/StaticNode.ts';
import type { EngineXPathNode } from './kind.ts';
import type { getNamespaceDeclarations } from './traversal.ts';

export const getEngineXPathNodeNamespaceURI = (node: EngineXPathNode): string | null => {
	switch (node.nodeType) {
		case 'primary-instance':
		case 'static-text':
			return null;

		case 'static-attribute':
		case 'static-element':
			return node.namespaceURI;

		default:
			return XFORMS_NAMESPACE_URI;
	}
};

/**
 * @todo currently, neither {@link InstanceNode} nor {@link StaticNode} account
 * for prefixes in qualified names. This was already a general enough gap that
 * it makes sense to defer to a broader solution as it becomes a priority
 * (likely prompted by a bug report about unexpected behavior of the XPath
 * `name` function).
 */
export const getEngineXPathNodeQualifiedName = (node: EngineXPathNode): string => {
	return getEngineXPathNodeLocalName(node);
};

export const getEngineXPathNodeLocalName = (node: EngineXPathNode): string => {
	switch (node.nodeType) {
		case 'static-attribute':
		case 'static-element':
			return node.localName;

		case 'static-document':
		case 'static-text':
			return '';

		default:
			return node.definition.localName;
	}
};

export const getEngineProcessingInstructionName =
	XPathFunctionalityNotSupportedError.createStubImplementation('processing-instruction');

/**
 * @todo @see {@link getNamespaceDeclarations}
 */
export const resolveEngineXPathNodeNamespaceURI = (_: EngineXPathNode, prefix: string | null) => {
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
