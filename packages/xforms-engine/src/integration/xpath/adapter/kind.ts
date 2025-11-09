import type { XPathNodeKind } from '@getodk/xpath';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { AnyChildNode, AnyNode, AnyParentNode } from '../../../instance/hierarchy.ts';
import type { PrimaryInstance } from '../../../instance/PrimaryInstance.ts';
import type { StaticAttribute } from '../static-dom/StaticAttribute.ts';
import type { StaticDocument } from '../static-dom/StaticDocument.ts';
import type { StaticElement } from '../static-dom/StaticElement.ts';
import type { StaticText } from '../static-dom/StaticText.ts';
import type {
	XFormsXPathComment,
	XFormsXPathDocument,
	XFormsXPathElement,
	XFormsXPathPrimaryInstanceNode,
} from './XFormsXPathNode.ts';

export type PrimaryInstanceXPathNode = Extract<AnyNode, XFormsXPathPrimaryInstanceNode>;

export type PrimaryInstanceXPathElement = Extract<AnyChildNode, XFormsXPathElement>;

export type PrimaryInstanceXPathComment = Extract<AnyChildNode, XFormsXPathComment>;

// prettier-ignore
export type PrimaryInstanceXPathChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstanceXPathElement
	| PrimaryInstanceXPathComment;

// prettier-ignore
export type EngineXPathDocument =
	| PrimaryInstance
	| StaticDocument;

// prettier-ignore
export type EngineXPathElement =
	| PrimaryInstanceXPathElement
	| StaticElement;

// prettier-ignore
export type EngineXPathComment =
	| PrimaryInstanceXPathComment;

// Giving this a type alias anticipates eventually implementing attributes
// in primary instance state as well
export type EngineXPathAttribute = StaticAttribute;

export type EngineXPathText = StaticText;

// prettier-ignore
export type XFormsXPathChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| EngineXPathElement
	| EngineXPathText
	| EngineXPathComment;

// prettier-ignore
type XPathAdapterParentNode =
	| XFormsXPathDocument
	| XFormsXPathElement;

type PrimaryInstanceXPathParentNode = Extract<AnyParentNode, XPathAdapterParentNode>;

// prettier-ignore
export type EngineXPathParentNode =
	| PrimaryInstanceXPathParentNode
	| StaticDocument
	| StaticElement;

// prettier-ignore
export type EngineXPathNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| EngineXPathDocument
	| EngineXPathElement
	| EngineXPathAttribute
	| EngineXPathText
	| EngineXPathComment;

export const isEngineXPathNode = (value: unknown): value is EngineXPathNode => {
	return typeof value === 'object' && value != null && XPathNodeKindKey in value;
};

export const getEngineXPathNodeKind = (node: EngineXPathNode): XPathNodeKind => {
	return node[XPathNodeKindKey];
};

export const isEngineXPathElement = (node: EngineXPathNode): node is EngineXPathElement => {
	return getEngineXPathNodeKind(node) === 'element';
};
