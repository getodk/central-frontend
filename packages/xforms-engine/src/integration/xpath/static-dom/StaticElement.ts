import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { QualifiedNameSource } from '../../../lib/names/QualifiedName.ts';
import { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { EngineDOMAdapter } from '../adapter/engineDOMAdapter.ts';
import type { XFormsXPathElement } from '../adapter/XFormsXPathNode.ts';
import type { StaticAttributeOptions } from './StaticAttribute.ts';
import { StaticAttribute } from './StaticAttribute.ts';
import type { StaticDocument } from './StaticDocument.ts';
import type { StaticChildNode } from './StaticNode.ts';
import { staticNodeName } from './staticNodeName.ts';
import { StaticParentNode } from './StaticParentNode.ts';
import { StaticText } from './StaticText.ts';

// prettier-ignore
export type StaticElementChildOption =
	| StaticElementOptions
	| string;

export interface StaticElementOptions {
	readonly name: QualifiedNameSource | string;
	readonly attributes?: readonly StaticAttributeOptions[];
	readonly children?: readonly StaticElementChildOption[];
}

interface StaticElementChildrenResult {
	readonly children: readonly StaticChildNode[];
	readonly childElements: readonly StaticElement[];
	readonly leafValue: string | null;
}

const leafElementChildrenResult = (
	parent: StaticElement,
	leafValue: string
): StaticElementChildrenResult => {
	const child = new StaticText(parent, leafValue);

	return {
		children: [child],
		childElements: [],
		leafValue: leafValue,
	};
};

const blankLeafElementChildrenResult = (parent: StaticElement): StaticElementChildrenResult => {
	return leafElementChildrenResult(parent, '');
};

/**
 * Builds several "views" into a {@link StaticElement}'s children as:
 *
 * - An array of all of its {@link StaticChildNode | child nodes}
 * - A subset array of only its {@link StaticElement | child elements}
 * - A {@link StaticElementChildrenResult.leafValue | "leaf value"} which is
 *   populated with the text value of a {@link StaticText | text node} if **and
 *   only if** that text node is the element's sole child node (which is in turn
 *   used to identify which _elements_ are {@link StaticLeafElement | leaf}
 *   nodes)
 *
 * @todo this is awkwardly named and awkward to describe! It's done this way for
 * efficiency (which makes a substantial difference for large forms), at the
 * expense of code clarity.
 *
 * @todo Handle comment nodes (1): we have discussed the possibility of using
 * comments as a placeholder for omitted non-relevant repeat instances, as an
 * aide to recreating them in restore/edit modes.
 *
 * @todo Handle comment nodes (2): comments are currently _effectively implied_
 * in the function-body comment about a homogenous sequence of 2+ strings, i.e.
 * in a structure like `<foo>bar<!-- bat -->quux</foo>`. If we handle comment
 * nodes, the only way we'd encounter that scenario is if we're parsing a
 * `StaticElement` from a DOM `Element` (or some other source with similar
 * semantics) where its child nodes have been manipulated into that state. As
 * such, if we do handle comments, that comment should likely be removed.
 */
const buildStaticElementChildren = (
	parent: StaticElement,
	options: StaticElementOptions
): StaticElementChildrenResult => {
	const children = Array<StaticChildNode>();
	const childElements = Array<StaticElement>();
	const childOptions = options.children ?? [''];

	// No children: blank value
	if (childOptions.length === 0) {
		return {
			children,
			childElements,
			leafValue: '',
		};
	}

	const [head, ...tail] = childOptions;

	if (tail.length === 0) {
		// - If no child options are specified, default to a single empty/blank
		//   `StaticText` child node, and assign its value
		if (head == null) {
			return blankLeafElementChildrenResult(parent);
		}

		// - If exactly one child option is specified, and it is a string, create
		//   `StaticText` child and assign its value
		if (typeof head === 'string') {
			return leafElementChildrenResult(parent, head);
		}
	}

	// If 2+ child options, for each:
	//
	// - Populate `children` (and `childElements`, as appopriate)
	// - Do not populate `value`. For cases which need an arbitrary
	//   `StaticElement`'s text value (i.e. `XPath`, perhaps eventually some
	//   serialization use cases), it will be computed recursively as needed.
	//
	// Note: in theory, we may encounter a homogenous sequence of 2+ strings! In
	// theory we should normalize those into a single string.
	if (typeof head === 'string' && tail.length === 0) {
		const child = new StaticText(parent, head);

		children.push(child);

		return {
			children,
			childElements,
			leafValue: child.value,
		};
	}

	for (const item of childOptions) {
		switch (typeof item) {
			case 'string':
				children.push(new StaticText(parent, item));
				break;

			case 'object': {
				const childElement = new StaticElement(parent, item);

				children.push(childElement);
				childElements.push(childElement);

				break;
			}

			default:
				throw new UnreachableError(item);
		}
	}

	return {
		children,
		childElements,
		leafValue: null,
	};
};

export class StaticElement extends StaticParentNode<'element'> implements XFormsXPathElement {
	private computedValue: string | null;

	readonly rootDocument: StaticDocument;
	readonly root: StaticElement;
	readonly qualifiedName: QualifiedName;
	readonly nodeset: string;
	readonly attributes: readonly StaticAttribute[];
	readonly children: readonly StaticChildNode[];
	readonly childElements: readonly StaticElement[];
	readonly value: string | null;

	constructor(
		readonly parent: StaticDocument | StaticElement,
		options: StaticElementOptions
	) {
		super('element');

		const { rootDocument } = parent;
		let nodesetPrefix = parent.nodeset;

		this.rootDocument = rootDocument;

		// Account for the fact that we may be constructing the document root!
		if (parent === rootDocument) {
			this.root = this;

			// Avoid nodeset like `//foo` when `/foo` is expected/intended
			if (nodesetPrefix === '/') {
				nodesetPrefix = '';
			}
		} else {
			this.root = parent.root;
		}

		const { name, attributes = [] } = options;

		this.qualifiedName = staticNodeName(name);
		this.nodeset = `${nodesetPrefix}/${this.qualifiedName.getPrefixedName()}`;
		this.attributes = attributes.map((attrOptions) => {
			return new StaticAttribute(this, attrOptions);
		});

		const { children, childElements, leafValue } = buildStaticElementChildren(this, options);

		this.children = children;
		this.childElements = childElements;
		this.computedValue = leafValue;
		this.value = leafValue;
	}

	isLeafElement(): this is StaticLeafElement {
		return this.value != null;
	}

	assertLeafElement(): asserts this is StaticLeafElement {
		if (!this.isLeafElement()) {
			throw new ErrorProductionDesignPendingError();
		}
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching
	 */
	protected getAttributeNode(localName: string): StaticAttribute | null {
		return (
			this.attributes.find((attribute) => {
				return attribute.qualifiedName.localName === localName;
			}) ?? null
		);
	}

	/**
	 * @todo Generalize this, incorporate into {@link EngineDOMAdapter}
	 * @todo Namespaced lookup
	 * @todo Optimize: lookup from map and/or caching (especially asserting known
	 * attributes!)
	 * @todo As long as this depends on {@link getAttributeNode}, push assertion
	 * up. (This was put off because the types are already plenty complex as it
	 * is.)
	 */
	getAttributeValue(localName: string): string | null {
		const attribute = this.getAttributeNode(localName);
		const value = attribute?.value ?? null;

		return value;
	}

	// XFormsXPathElement
	getXPathValue(): string {
		const { computedValue } = this;

		if (computedValue != null) {
			return computedValue;
		}

		const result = this.children.map((child) => child.getXPathValue()).join('');

		this.computedValue = result;

		return result;
	}
}

export interface StaticLeafElement extends StaticElement {
	readonly value: string;
}
