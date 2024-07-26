import type { LeafNodeDefinition } from '../model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { RootNode } from './RootNode.ts';
import type { LeafNodeValidationState } from './validation.ts';

export interface ModelValueNodeState extends BaseNodeState {
	get label(): null;
	get hint(): null;
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the current value of a {@link ModelValueNode}. This value may be
	 * populated when a form is loaded, and it may be updated by certain
	 * computations defined by the form.
	 */
	get value(): string;
}

export interface ModelValueDefinition extends LeafNodeDefinition {
	readonly bodyElement: null;
}

/**
 * A node which is:
 *
 * - model-only (i.e. it has no corresponding body element)
 * - a leaf/value node (i.e. it has no element children; it may be defined in
 *   the form's `<model>` as either an {@link Element} or {@link Attr})
 */
export interface ModelValueNode extends BaseNode {
	readonly nodeType: 'model-value';
	readonly appearances: null;
	readonly definition: ModelValueDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: ModelValueNodeState;
	readonly validationState: LeafNodeValidationState;
}
