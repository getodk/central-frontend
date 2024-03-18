import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';

export interface StringNodeState extends BaseNodeState {
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the current value of a {@link StringNode}. This value may be
	 * populated when a form is loaded, and it may be updated by certain
	 * computations defined by the form. It may also be updated by a client, using
	 * the {@link StringNode.setValue} method.
	 */
	get value(): string;
}

/**
 * A node which can be assigned a string/text value. A string node **MAY**
 * correspond to form field defined as an XForms `<input>`, which a user-facing
 * client would likely present for a user to fill. It may not correspond to an
 * `<input>`, or necessarily have any presentational implications for a client
 * (for instance if the node is bound to an XForms `calculate` expression).
 */
export interface StringNode extends BaseNode {
	readonly definition: ValueNodeDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;

	/**
	 * For use by a client to update the value of a string node.
	 *
	 * @todo [how] should we express write restrictions to a client? E.g. what
	 * happens when a string node is readonly, and a client attempts to call this
	 * method?
	 */
	setValue(value: string): RootNode;
}
