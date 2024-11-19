import type { XPathDOMOptimizableOperations } from './XPathDOMOptimizableOperations.ts';
import type { XPathNameAdapter } from './XPathNameAdapter.ts';
import type { XPathNode } from './XPathNode.ts';
import type { XPathNodeKindAdapter } from './XPathNodeKindAdapter.ts';
import type { XPathTraversalAdapter } from './XPathTraversalAdapter.ts';
import type { XPathValueAdapter } from './XPathValueAdapter.ts';

export interface XPathDOMAdapter<T extends XPathNode>
	extends XPathNodeKindAdapter<T>,
		XPathNameAdapter<T>,
		XPathValueAdapter<T>,
		XPathTraversalAdapter<T>,
		Partial<XPathDOMOptimizableOperations<T>> {}

export type * from './XPathNode.ts';
export { XPathNodeKindKey } from './XPathNode.ts';

export type { XPathCustomUnwrappableNode } from './XPathCustomUnwrappableNode.ts';

export type * from './XPathDOMOptimizableOperations.ts';
export type * from './XPathNameAdapter.ts';
export type * from './XPathNodeKindAdapter.ts';
export type * from './XPathTraversalAdapter.ts';
export type * from './XPathValueAdapter.ts';
