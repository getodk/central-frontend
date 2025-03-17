import type { AnyRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { BaseNode, BaseNodeState } from '../BaseNode.ts';
import type { GeneralChildNode, RepeatRangeNode } from '../hierarchy.ts';
import type { NodeAppearances } from '../NodeAppearances.ts';
import type { RootNode } from '../RootNode.ts';
import type { AncestorNodeValidationState } from '../validation.ts';
import type { BaseRepeatRangeNode } from './BaseRepeatRangeNode.ts';

export interface RepeatInstanceNodeState extends BaseNodeState {
	// TODO(?): Previous iteration included an `index` getter here. I don't see it
	// accessed by the current (Solid) client, and I don't know that it really has
	// any use to a client that wouldn't be satisfied by accessing the same index
	// while iterating the parent range's children.

	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export type { AnyRepeatDefinition };

export type RepeatInstanceNodeAppearances = NodeAppearances<AnyRepeatDefinition>;

export interface RepeatInstanceNode extends BaseNode {
	readonly nodeType: 'repeat-instance';
	readonly appearances: RepeatInstanceNodeAppearances;
	readonly definition: AnyRepeatDefinition;
	readonly root: RootNode;

	/**
	 * A repeat instance may only be a child of a {@link RepeatRangeNode}.
	 *
	 * Note: the web-forms engine's representation of this structure differs from
	 * the underlying XForms specification's primary instance structure.
	 *
	 * @see {@link BaseRepeatRangeNode} for additional detail.
	 */
	readonly parent: RepeatRangeNode;

	readonly currentState: RepeatInstanceNodeState;
	readonly validationState: AncestorNodeValidationState;
}
