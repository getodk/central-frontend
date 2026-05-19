import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { ChildNodeDefinition } from '../../parse/model/NodeDefinition.ts';
import type { DescendantNode } from '../abstract/DescendantNode.ts';
import type { childrenInitOptions } from './childrenInitOptions.ts';

/**
 * @todo We could pretty significantly simplify downstream child node
 * construction logic, if we break this down into a tagged union (essentially
 * moving the branchy type refinement aspects up the stack, probably trimming
 * the construction logic itself down to a switch statement). At which point,
 * it'd also probably be easier to reason about each of those constructors
 * accepting input exactly as it's represented as a member of this hypothetical
 * tagged union. Something like this:
 *
 * - Revise each concrete {@link DescendantNode} class to accept an options-like
 *   object suitable for its construction, each respectively defined by an
 *   interface whose name is consistent with that node
 * - Update this type to be a union of those interfaces
 * - Implement that in {@link childrenInitOptions}
 * - Update downstream construction to switch over whatever narrows the union
 * - Bonus points: revise each concrete {@link DescendantNode} to use a common
 *   constructor API (i.e. a static `from` method, since several such classes
 *   already have private constructors). Then downstream isn't even a switch
 *   statement, it's just a lookup table.
 *
 * @todo As of this commit, and as now mentioned on {@link DescendantNode}, and
 * as discussed in
 * {@link https://github.com/getodk/web-forms/pull/352#discussion_r2008237762}:
 * this interface is intended as an intermediate step toward these goals.
 */
export interface DescendantNodeInitOptions {
	readonly childNodeset: string;
	readonly definition: ChildNodeDefinition;
	readonly instanceNodes: readonly StaticElement[];
}
