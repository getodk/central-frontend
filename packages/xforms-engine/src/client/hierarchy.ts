import type { ExpandUnion } from '@getodk/common/types/helpers.d.ts';
import type { GroupNode } from './GroupNode.ts';
import type { ModelValueNode } from './ModelValueNode.ts';
import type { NoteNode } from './NoteNode.ts';
import type { RepeatInstanceNode } from './RepeatInstanceNode.ts';
import type { RepeatRangeNode } from './RepeatRangeNode.ts';
import type { RootNode } from './RootNode.ts';
import type { SelectNode } from './SelectNode.ts';
import type { StringNode } from './StringNode.ts';
import type { SubtreeNode } from './SubtreeNode.ts';

// prettier-ignore
export type AnyControlNode =
	| NoteNode
	| SelectNode
	| StringNode;

// prettier-ignore
export type AnyLeafNode =
	| AnyControlNode
	| ModelValueNode;

/**
 * Any of the concrete node types which may be a parent of any other node.
 *
 * This is an intermediate type, which shouldn't be referenced by other concrete
 * node types directly. Instead:
 *
 * - Repeat instances should (continue to) specify {@link RepeatRangeNode}.
 * - All other child nodes should specify {@link GeneralParentNode}.
 */
export type AnyParentNode =
	| RootNode // eslint-disable-line @typescript-eslint/sort-type-constituents
	| SubtreeNode
	| GroupNode
	| RepeatRangeNode
	| RepeatInstanceNode;

/**
 * Any of the concrete node types a client may get from the engine's form
 * representation. This union should be updated when any new concrete node type
 * is added (or when any of the current members is changed/removed).
 *
 * @see {@link GeneralParentNode}, which is derived from this type
 * @see {@link GeneralChildNode}, which is derived from this type
 */
export type AnyNode = ExpandUnion<AnyLeafNode | AnyParentNode>;

/**
 * Any of the concrete node types which may be a parent of non-repeat instance
 * child nodes.
 */
export type GeneralParentNode = Exclude<AnyParentNode, RepeatRangeNode>;

/**
 * Any of the concrete node types which may be a child of any other node.
 *
 * This is an intermediate type, which shouldn't be referenced by other concrete
 * node types directly. Instead:
 *
 * - Repeat ranges should (continue to) specify {@link RepeatInstanceNode}.
 * - All other parent nodes should specify {@link GeneralChildNode}.
 */
// prettier-ignore
export type AnyChildNode = Exclude<AnyNode, RootNode>;

/**
 * Any of the concrete node types which may be a child of non-repeat range
 * parent nodes.
 */
export type GeneralChildNode = Exclude<AnyChildNode, RepeatInstanceNode>;
