import type { XPathNode } from './XPathNode.ts';

/**
 * @todo This interface is temporarily, intentionally empty! In subsequent
 * commits, it will be expanded to define the abstract XPath DOM semantics we'll
 * use to support arbitrary DOM adapter implementations. It will be
 * progressively derived from a concrete implementation of the same, as
 * refactored from existing (web standard/WHAT Working Group) DOM API usage.
 * Once that refactor is complete, this comment should be replaced with a more
 * complete JSDoc block.
 */
// @ts-expect-error - This addresses the unused type parameter `T`, which will also be used in a subsequent commit.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface XPathDOMAdapter<
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	T extends XPathNode,
> {}

export type * from './XPathNode.ts';
export { XPathNodeKindKey } from './XPathNode.ts';
