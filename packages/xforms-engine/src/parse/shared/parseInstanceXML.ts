import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { StaticNode } from '../../integration/xpath/static-dom/StaticNode.ts';
import type { NamespaceDeclarationMap } from '../../lib/names/NamespaceDeclarationMap.ts';
import { escapeXMLText } from '../../lib/xml-serialization.ts';
import type { ModelDefinition } from '../model/ModelDefinition.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import { parseStaticDocumentFromDOMSubtree } from './parseStaticDocumentFromDOMSubtree.ts';

type WrappedInstanceXML = `<wrapped${string}</wrapped>`;

const wrapInstanceXML = (model: ModelDefinition, instanceXML: string): WrappedInstanceXML => {
	const defaultNamespace = model.root.namespaceDeclarations.get(null);
	const defaultNamespaceURI = defaultNamespace?.declaredURI?.href;

	if (defaultNamespaceURI == null) {
		return `<wrapped>${instanceXML}</wrapped>`;
	}

	return /* xml */ `<wrapped xmlns="${escapeXMLText(defaultNamespaceURI, true)}">
		${instanceXML}
	</wrapped>`;
};

type AssertSoleChildElement = (element?: Element | null) => asserts element is Element;

const assertSoleChildElement: AssertSoleChildElement = (element) => {
	if (element == null) {
		throw new ErrorProductionDesignPendingError('Expected a child element');
	}

	const { parentNode } = element;

	if (parentNode == null) {
		throw new ErrorProductionDesignPendingError('Expected element to be a child of a parent node');
	}

	if (element !== parentNode.firstElementChild || element !== parentNode.lastElementChild) {
		throw new ErrorProductionDesignPendingError(
			"Expected child element to be parent node's only element child."
		);
	}
};

const getWrappedInstanceRootElement = (xml: WrappedInstanceXML): Element => {
	const domParser = new DOMParser();
	const doc = domParser.parseFromString(xml, 'text/xml');
	const { documentElement } = doc;
	const [root] = documentElement.children;

	assertSoleChildElement(root);

	return root;
};

/**
 * Parses incoming instance XML input into a {@link StaticDocument}, preserving
 * the form definition's default namespace URI (when the instance XML does not
 * explicitly declare a default namespace).
 *
 * @todo This is a hack! A proper solution will involve extending namespace
 * resolution (i.e. probably {@link NamespaceDeclarationMap}) from
 * {@link RootDefinition} on down throughout the instance's {@link StaticNode}
 * tree. The same will probably be the case for parsing (XML) external secondary
 * instances as well, so at that point we can also stop using this specialized
 * name!
 *
 * @todo Aside from this being a hack, it's not very robust because it makes
 * assumptions which are _likely but definitely not guaranteed_!
 *
 * - Instance XML (probably) doeesn't declare a default namespace
 * - Instance XML **definitely** declares non-default namespaces
 */
export const parseInstanceXML = (model: ModelDefinition, instanceXML: string): StaticDocument => {
	const wrappedXML = wrapInstanceXML(model, instanceXML);
	const root = getWrappedInstanceRootElement(wrappedXML);

	return parseStaticDocumentFromDOMSubtree(root);
};
