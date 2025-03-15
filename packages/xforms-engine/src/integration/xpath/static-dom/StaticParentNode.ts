import { XPathNodeKindKey } from '@getodk/xpath';
import type { StaticElement } from './StaticElement.ts';
import { StaticNode, type StaticChildNode } from './StaticNode.ts';

type StaticParentNodeKind = 'document' | 'element';

type StaticParentNodeType<Kind extends StaticParentNodeKind> = `static-${Kind}`;

export abstract class StaticParentNode<Kind extends StaticParentNodeKind> extends StaticNode<Kind> {
	abstract override readonly children: readonly StaticChildNode[];
	abstract readonly childElements: readonly StaticElement[];

	readonly [XPathNodeKindKey]: Kind;
	readonly nodeType: StaticParentNodeType<Kind>;

	constructor(kind: Kind) {
		super();

		this[XPathNodeKindKey] = kind;
		this.nodeType = `static-${kind}`;
	}
}
