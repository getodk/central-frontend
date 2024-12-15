// import type { StaticNodeBrand } from '@getodk/xpath';
import { XPathNodeKindKey } from '@getodk/xpath';
import type { XFormsXPathNode } from '../adapter/XFormsXPathNode.ts';
import type { StaticAttribute } from './StaticAttribute.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticElement } from './StaticElement.ts';
import type { StaticText } from './StaticText.ts';

// prettier-ignore
export type StaticNodeKind =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'document'
	| 'element'
	| 'attribute'
	| 'text';

// prettier-ignore
export type StaticNodeType<Kind extends StaticNodeKind> = `static-${Kind}`;

export abstract class StaticNode<Kind extends StaticNodeKind> implements XFormsXPathNode {
	abstract readonly [XPathNodeKindKey]: Kind;

	abstract readonly nodeType: StaticNodeType<Kind>;

	/**
	 * A concrete {@link StaticDocument} instance, representing the topmost node
	 * of a static document tree, containing all of:
	 *
	 * - {@link root}
	 * - {@link children}
	 * - any {@link StaticChildNode} descendants of either of the above
	 */
	abstract readonly rootDocument: StaticDocument;

	/**
	 * A concrete {@link StaticElement} instance, representing the single,
	 * immediate child of {@link rootDocument}, containing all other descendants
	 * of its document tree.
	 */
	abstract readonly root: StaticElement;

	abstract readonly children: readonly StaticChildNode[] | null;

	// XFormsXPathNode
	getXPathChildNodes(): readonly StaticChildNode[] {
		return this.children ?? [];
	}

	abstract getXPathValue(): string;
}

// prettier-ignore
export type AnyStaticNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| StaticDocument
	| StaticElement
	| StaticAttribute
	| StaticText;

// prettier-ignore
export type StaticNodeParent =
	| StaticDocument
	| StaticElement;

// prettier-ignore
export type StaticChildNode =
	| StaticElement
	| StaticText;
