import type { TokenListParser } from '../lib/TokenListParser.ts';
import type { AnyNodeDefinition } from '../model/NodeDefinition.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';
import type { TextRange } from './TextRange.ts';
import type { InstanceNodeType } from './node-types.ts';
import type {
	AncestorNodeValidationState,
	LeafNodeValidationState,
	NodeValidationState,
} from './validation.ts';

export interface BaseNodeState {
	/**
	 * Location path reference to the node's primary instance state. This property
	 * may change if a node's position changes, e.g. when a repeat instance is
	 * removed. Its potential reactivity allows nodes to re-run computations which
	 * depend on the node's position itself, or when any other relative reference
	 * might target different nodes as a result of the positional change.
	 *
	 * @example
	 * /data/repeat[1]/foo
	 * /data/repeat[2]/foo
	 */
	get reference(): string;

	/**
	 * Note: a node's `readonly` state may become `true` by inheriting that state
	 * from one of its ancestors. Computing this inheritance is handled by the
	 * engine, but it may be of interest to clients.
	 *
	 * In the future, a more granular type might convey this detail more
	 * explicitly (at the expense of a more complex type). For now, a client can
	 * infer that inheritance by visiting the
	 * {@link BaseNode.parent | parent node}.
	 */
	get readonly(): boolean;

	/**
	 * Note: a node's `relevant` state may become `false` by inheriting that state
	 * from one of its ancestors. Computing this inheritance is handled by the
	 * engine, but it may be of interest to clients.
	 *
	 * In the future, a more granular type might convey this detail more
	 * explicitly (at the expense of a more complex type). For now, a client can
	 * infer that inheritance by visiting the
	 * {@link BaseNode.parent | parent node}.
	 */
	get relevant(): boolean;

	/**
	 * Specifies whether the node must have a non-blank value to be valid (see
	 * {@link value} for details).
	 *
	 * @see {@link https://getodk.github.io/xforms-spec/#bind-attributes}
	 *
	 * @default false
	 *
	 * @todo What is the expected behavior of `required` expressions defined for
	 * non-leaf/value nodes?
	 */
	get required(): boolean;

	/**
	 * Interfaces for nodes which cannot provide a label should override this to
	 * specify that the property will always be `null`.
	 */
	get label(): TextRange<'label'> | null;

	/**
	 * Interfaces for nodes which cannot provide a hint should override this to
	 * specify that the property will always be `null`.
	 */
	get hint(): TextRange<'hint'> | null;

	/**
	 * Each node's children (if it is a parent node) will be accessed on that
	 * node's state. While some node types will technically have static children,
	 * other nodes' children will be stateful (i.e. repeats). For a client, both
	 * cases are accessed the same way for consistency.
	 *
	 * Certain kinds of nodes are considered parent nodes: they may have child
	 * nodes. In some cases (presently, repeat ranges), children may be added or
	 * removed while a user is filling a form. As such, those children must be
	 * accessed as part of the node's
	 * {@link BaseNode.currentState | current state}. (In contrast, child nodes
	 * are never moved between different parents, so their
	 * {@link BaseNode.parent | parent} is static rather than part of their
	 * current state).
	 *
	 * A node is either:
	 *
	 * - Always a parent, in which case its `children` state should always produce
	 *   an array. When the parent node's children can be added or removed, an
	 *   empty array should be used to represent the absence of any children in
	 *   its current state.
	 * - Never a parent, in which case its `children` state should always produce
	 *   `null`. Such a node will instead have a {@link value}.
	 */
	get children(): readonly BaseNode[] | null;

	/**
	 * Certain kinds of nodes restrict their {@link value} to a specific set of
	 * valid values. Where they do, they will provide a collection (typically an
	 * array) of those values. This collection may be updated depending on other
	 * aspects of form state, which is why it is treated as a part of the node's
	 * state.
	 *
	 * Nodes which do not have this restriction (including nodes which cannot have
	 * a value at all) will always produce `valueOptions: null`.
	 */
	get valueOptions(): unknown;

	/**
	 * Certain kinds of nodes store a value state. Where they do, they will
	 * specify the type of the value directly.
	 *
	 * Parent nodes, i.e. nodes which can contain {@link children}, do not store a
	 * value state. For those nodes, their value state should always be `null`.
	 *
	 * A node's value is considered "blank" when its primary instance state is an
	 * empty string, and it is considered "non-blank" otherwise. The engine may
	 * represent node values according to aspects of the node's definition (such
	 * as its defined data type, its associated control type if any). The node's
	 * value being blank or non-blank may contribute to satisfying conditions of
	 * the node's validity ({@link constraint}, {@link required}). Otherwise, it
	 * is an internal engine consideration.
	 */
	get value(): unknown;
}

type FormNodeID = string;

/**
 * Base interface for common/shared aspects of any node type.
 */
export interface BaseNode {
	/**
	 * Specifies the node's general type. This can be useful for narrowing types,
	 * e.g. those of children.
	 */
	readonly nodeType: InstanceNodeType;

	/**
	 * Each node has a unique identifier. This identifier is stable throughout
	 * the lifetime of an active session filling a form.
	 */
	readonly nodeId: FormNodeID;

	/**
	 * @see {@link TokenListParser} for details.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly appearances: NodeAppearances<any> | null;

	/**
	 * Each node has a definition which specifies aspects of the node defined in
	 * the form. These aspects include (but are not limited to) the node's data
	 * type, its body presentation constraints (if any), its bound nodeset, and
	 * so on...
	 *
	 * @todo Interfaces for specific (non-base) node types should override this
	 * to specify the actual (concrete or union) type of their `definition`.
	 */
	readonly definition: AnyNodeDefinition;

	/**
	 * Each node links back to the node representing the root of the form.
	 *
	 * @todo Interfaces for all concrete node types should override this to
	 * specify the actual root node type.
	 */
	readonly root: BaseNode;

	/**
	 * Each node links back to its parent, if any. All nodes have a parent except
	 * the form's {@link root}.
	 */
	// TODO: the `children` state property discusses the fact that a child node
	// cannot be reassigned to another parent. As such, it is currently treated as
	// static. This fails to address the removal of nodes, i.e. when removing
	// repeat instances. This suggests that perhaps `parent` should also be part
	// of the node's state. However that would be insufficient to communicate the
	// same information about a removed node's descendants. Some considerations:
	//
	// 1. If `parent` becomes part of state, how do we communicate that removal is
	//    the only possible state change (as in, a child node will never be
	//    reassigned to another parent)?
	// 2. If `parent` does become nullable state, how best to convey the same
	//    information for removed descendants. Some ideas:
	//
	//    - Apply null-as-removed recursively. This wouldn't technically be true
	//      for the engine's current use of a DOM backing store (but that's an
	//      implementation detail clients don't/shouldn't care about).
	//
	//    - Borrow the browser DOM's notion of node "connected"-ness. When a node
	//      is removed, its `isConnected` property is `false`. The same is true
	//      for any of its descendants, even though they retain their own direct
	//      parent reference.
	readonly parent: BaseNode | null;

	/**
	 * Each node provides a discrete object representing the stateful aspects\* of
	 * that node which will change over time. When a client provides a
	 * {@link OpaqueReactiveObjectFactory}, the engine will update the properties
	 * of this object as their respective states change, so a client can implement
	 * reactive updates that respond to changes as they occur.
	 *
	 * \* This includes state which is either client-/user-mutable, or state which
	 *    is computed based on the core XForms computation model. Each node also
	 *    exposes {@link validationState}, which reflects the validity of the
	 *    node, or its descendants.
	 */
	readonly currentState: BaseNodeState;

	/**
	 * Represents the validation state of a the node itself, or its descendants.
	 *
	 * @see {@link AncestorNodeValidationState} and
	 * {@link LeafNodeValidationState} for additional details.
	 *
	 * While filling a form (i.e. prior to submission), validation state can be
	 * viewed as computed metadata about the form state. The validation conditions
	 * and their violation messages produced by a node _may be computed on
	 * demand_. Clients should assume:
	 *
	 * 1. Validation state **will be current** when directly read by the client.
	 *    Accessing validation state _may_ invoke engine computation of that state
	 *    _at that time_.
	 *
	 *    It **may** also be pre-computed by the engine so that direct reads are
	 *    less computationally expensive, but such optimizations cannot be
	 *    guaranteed by the engine at this time.
	 *
	 * 2. For clients providing an {@link OpaqueReactiveObjectFactory}, accessing
	 *    validation state within a reactive context **will produce updates** to
	 *    the validation state, as long as the client retains a subscription to
	 *    that state.
	 *
	 *    If it is possible to detect interruption of such client- reactive
	 *    subscriptions, the engine _may defer computations_ until subsequent
	 *    client read/re-subscription, in order to reduce unnecessary
	 *    computational overhead. Again, such optimizations cannot be guaranteed
	 *    by the engine at this time.
	 *
	 * @todo it's easier to conceive a reliable, general solution to optimizing
	 * the direct read case, than it is for the client-reactive case (largely
	 * because our solution for client reactivity is intentionally opaque). If it
	 * turns out that such optimizations are crucial for overall usability, the
	 * client-reactive case may best be served by additional APIs for reactive
	 * clients to explicitly pause and resume recomputation.
	 */
	readonly validationState: NodeValidationState;
}
