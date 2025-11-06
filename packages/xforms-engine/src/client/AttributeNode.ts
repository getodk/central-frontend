import type { Root } from '../instance/Root.ts';
import type { AttributeDefinition } from '../parse/model/AttributeDefinition.ts';
import type { OpaqueReactiveObjectFactory } from './OpaqueReactiveObjectFactory.ts';
import type { InstanceState } from './serialization/InstanceState.ts';

export interface AttributeNodeState {
	get value(): string;
}

/**
 * Base interface for common/shared aspects of attributes.
 */
export interface AttributeNode {
	/**
	 * Specifies the node's general type. This can be useful for narrowing types,
	 * e.g. those of children.
	 */
	readonly nodeType: 'attribute';

	/**
	 * Each node has a definition which specifies aspects of the node defined in
	 * the form. These aspects include (but are not limited to) the node's data
	 * type, its body presentation constraints (if any), its bound nodeset, and
	 * so on...
	 */
	readonly definition: AttributeDefinition;

	/**
	 * Each node links back to the node representing the root of the form.
	 */
	readonly root: Root;

	/**
	 * Each node links back to its parent, if any. All nodes have a parent except
	 * the form's {@link root}.
	 */
	readonly parent: unknown;

	/**
	 * Each node provides a discrete object representing the stateful aspects of
	 * that node which will change over time. This includes state which is either
	 * client-/user-mutable, or state which is computed based on the core XForms
	 * computation model. Each node also exposes {@link validationState}, which
	 * reflects the validity of the node, or its descendants.
	 *
	 * When a client provides a {@link OpaqueReactiveObjectFactory}, the engine
	 * will update the properties of this object as their respective states
	 * change, so a client can implement reactive updates that respond to changes
	 * as they occur.
	 */
	readonly currentState: AttributeNodeState;

	/**
	 * Represents the current instance state of the node.
	 *
	 * @see {@link InstanceState.instanceXML} for additional detail.
	 */
	readonly instanceState: InstanceState;

	readonly appearances: null;
	readonly nodeOptions: null;
}
