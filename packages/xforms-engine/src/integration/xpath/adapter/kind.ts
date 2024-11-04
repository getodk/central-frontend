import type { AnyParentNode, AnyValueNode } from '../../../instance/hierarchy.ts';
import type { ValueContext } from '../../../instance/internal-api/ValueContext.ts';
import type { ItextTranslationDefinition } from '../../../parse/model/ItextTranslation/ItextTranslationDefinition.ts';
import type { ItextTranslationRootDefinition } from '../../../parse/model/ItextTranslation/ItextTranslationRootDefinition.ts';
import type { SecondaryInstanceDefinition } from '../../../parse/model/SecondaryInstance/SecondaryInstanceDefinition.ts';
import type { SecondaryInstanceRootDefinition } from '../../../parse/model/SecondaryInstance/SecondaryInstanceRootDefinition.ts';
import type { StaticAttribute } from '../static-dom/StaticAttribute.ts';
import type { StaticDocument } from '../static-dom/StaticDocument.ts';
import type { StaticElement } from '../static-dom/StaticElement.ts';
import type { StaticText } from '../static-dom/StaticText.ts';
import type { XFormsXPathDocument, XFormsXPathElement } from './XFormsXPathNode.ts';

// prettier-ignore
export type PrimaryInstanceXPathValueElement<Value> =
	& AnyValueNode
	& ValueContext<Value>
	& XFormsXPathElement;

// prettier-ignore
export type EngineXPathDocument =
	| ItextTranslationDefinition
	| SecondaryInstanceDefinition
	| StaticDocument;

// prettier-ignore
export type EngineXPathElement =

	| ItextTranslationRootDefinition
	| SecondaryInstanceRootDefinition
	| StaticElement;

// Giving this a type alias anticipates eventually implementing attributes
// in primary instance state as well
export type EngineXPathAttribute = StaticAttribute;

export type EngineXPathText = StaticText;

// prettier-ignore
export type XFormsXPathChildNode =

	| EngineXPathElement
	| EngineXPathText;

// prettier-ignore
type XPathAdapterParentNode =
	| XFormsXPathDocument
	| XFormsXPathElement;

type PrimaryInstanceXPathParentNode = Extract<AnyParentNode, XPathAdapterParentNode>;

// prettier-ignore
export type EngineXPathParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstanceXPathParentNode
	| ItextTranslationDefinition
	| SecondaryInstanceDefinition
	| ItextTranslationRootDefinition
	| SecondaryInstanceRootDefinition
	| StaticDocument
	| StaticElement;

// prettier-ignore
export type EngineXPathNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| EngineXPathDocument
	| EngineXPathElement
	| EngineXPathAttribute
	| EngineXPathText;
