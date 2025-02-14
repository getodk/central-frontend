import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyConstructor } from '@getodk/common/types/helpers.js';
import { StaticAttribute } from '../../integration/xpath/static-dom/StaticAttribute.ts';
import type {
	StaticDocument,
	StaticDocumentRootFactory,
} from '../../integration/xpath/static-dom/StaticDocument.ts';
import type {
	StaticElementAttributesFactory,
	StaticElementChildNodesFactory,
	StaticElementOptions,
} from '../../integration/xpath/static-dom/StaticElement.ts';
import { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { StaticParentNode } from '../../integration/xpath/static-dom/StaticNode.ts';
import { StaticText } from '../../integration/xpath/static-dom/StaticText.ts';

type ConcreteConstructor<T extends AnyConstructor> = Pick<T, keyof T>;

// prettier-ignore
export type ConcreteStaticDocumentConstructor<
	T extends StaticDocument<Root>,
	Root extends StaticElement,
> =
	& ConcreteConstructor<typeof StaticDocument<Root>>
	& (new (rootFactory: StaticDocumentRootFactory<T, Root>) => T);

const domElementAttributesFactory = (domElement: Element): StaticElementAttributesFactory => {
	const attributes = Array.from(domElement.attributes);

	return (element) => {
		return attributes.map((attr) => {
			return new StaticAttribute(element, attr);
		});
	};
};

const { ELEMENT_NODE, CDATA_SECTION_NODE, TEXT_NODE } = Node;

interface StaticChildElementSource {
	readonly domType: typeof ELEMENT_NODE;
	readonly domNode: Element;
}

interface StaticChildTextSource {
	readonly domType: typeof CDATA_SECTION_NODE | typeof TEXT_NODE;
	readonly domNode: CharacterData;
}

// prettier-ignore
type StaticChildNodeSource =
	| StaticChildElementSource
	| StaticChildTextSource;

export const toStaticChildNodeSource = (childNode: ChildNode): StaticChildNodeSource | null => {
	const domType = childNode.nodeType;

	switch (domType) {
		case ELEMENT_NODE:
			return {
				domType,
				domNode: childNode as Element,
			};

		case TEXT_NODE:
			return {
				domType,
				domNode: childNode as Text,
			};

		case CDATA_SECTION_NODE:
			return {
				domType,
				domNode: childNode as CDATASection,
			};

		default:
			return null;
	}
};

const toStaticChildNodeSources = (childNode: ChildNode): StaticChildNodeSource | readonly [] => {
	return toStaticChildNodeSource(childNode) ?? [];
};

const domElementChildNodesFactory = (domElement: Element): StaticElementChildNodesFactory => {
	const childNodeSources = Array.from(domElement.childNodes).flatMap(toStaticChildNodeSources);

	return (parent) => {
		return childNodeSources.map((domSource) => {
			switch (domSource.domType) {
				case ELEMENT_NODE:
					return parseStaticElementFromDOMElement(parent, StaticElement, domSource.domNode);

				case TEXT_NODE:
				case CDATA_SECTION_NODE:
					return new StaticText(parent, domSource.domNode.data);

				default:
					throw new UnreachableError(domSource);
			}
		});
	};
};

// prettier-ignore
export type StaticElementConstructor<
	T extends StaticElement<Parent>,
	Parent extends StaticParentNode = StaticParentNode
> =
	& ConcreteConstructor<typeof StaticElement>
	& {
			readonly prototype: T;

			new (
				parent: Parent,
				attributesFactory: StaticElementAttributesFactory,
				childNodesFactory: StaticElementChildNodesFactory,
				options: StaticElementOptions
			): T;
	};

const parseStaticElementFromDOMElement = <
	T extends StaticElement<Parent>,
	Parent extends StaticParentNode = StaticParentNode,
>(
	parent: Parent,
	ElementConstructor: StaticElementConstructor<T, Parent>,
	domElement: Element
): T => {
	const attributesFactory = domElementAttributesFactory(domElement);
	const childNodesFactory = domElementChildNodesFactory(domElement);

	return new ElementConstructor(parent, attributesFactory, childNodesFactory, domElement);
};

export const parseStaticDocumentFromDOMSubtree = <
	T extends StaticDocument<Root>,
	Root extends StaticElement<T>,
>(
	DocumentConstructor: ConcreteStaticDocumentConstructor<T, Root>,
	DocumentRootConstructor: StaticElementConstructor<Root, T>,
	subtreeRootElement: Element
): T => {
	const rootFactory: StaticDocumentRootFactory<T, Root> = (parent) => {
		return parseStaticElementFromDOMElement(parent, DocumentRootConstructor, subtreeRootElement);
	};

	return new DocumentConstructor(rootFactory);
};
