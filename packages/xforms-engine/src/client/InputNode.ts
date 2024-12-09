import type { InputControlDefinition } from '../parse/body/control/InputControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export interface InputNodeState extends BaseNodeState {
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the current value of a {@link InputNode}. This value may be
	 * populated when a form is loaded, and it may be updated by certain
	 * computations defined by the form. It may also be updated by a client, using
	 * the {@link InputNode.setValue} method.
	 */
	get value(): string;
}

export interface InputDefinition extends LeafNodeDefinition {
	readonly bodyElement: InputControlDefinition;
}

export type InputNodeAppearances = NodeAppearances<InputDefinition>;

/**
 * A node corresponding to form field defined as an
 * {@link https://getodk.github.io/xforms-spec/#body-elements | XForms `<input>`},
 * which a user-facing client would likely present for a user to fill..
 */
export interface InputNode extends BaseNode {
	readonly nodeType: 'input';
	readonly appearances: InputNodeAppearances;
	readonly definition: InputDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: InputNodeState;
	readonly validationState: LeafNodeValidationState;

	/**
	 * For use by a client to update the value of an {@link InputNode}.
	 */
	setValue(value: string): RootNode;
}
