import type { XPathNode } from './XPathNode.ts';
import type { XPathNodeKindAdapter } from './XPathNodeKindAdapter.ts';

export interface XPathDOMAdapter<T extends XPathNode> extends XPathNodeKindAdapter<T> {}

export type * from './XPathNode.ts';
export { XPathNodeKindKey } from './XPathNode.ts';

export type { XPathCustomUnwrappableNode } from './XPathCustomUnwrappableNode.ts';

export type * from './XPathNodeKindAdapter.ts';
