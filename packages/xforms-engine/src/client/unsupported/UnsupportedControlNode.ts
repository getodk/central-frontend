import type { UnknownAppearanceDefinition } from '../../parse/body/appearance/unknownAppearanceParser.ts';
import type { UploadControlDefinition } from '../../parse/body/control/UploadControlDefinition.ts';
import type { LeafNodeDefinition } from '../../parse/model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from '../BaseNode.ts';
import type { RootNode } from '../RootNode.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { UnsupportedControlNodeType } from '../node-types.ts';
import type { LeafNodeValidationState } from '../validation.ts';

export interface UnsupportedControlNodeState extends BaseNodeState {
	get children(): null;
	get valueOptions(): unknown;
	get value(): unknown;
}

// prettier-ignore
export type UnsupportedControlElementDefinition = UploadControlDefinition;

export interface UnsupportedControlDefinition extends LeafNodeDefinition {
	readonly bodyElement: UnsupportedControlElementDefinition;
}

/**
 * Stub node, for form controls pending further engine support.
 */
export interface UnsupportedControlNode extends BaseNode {
	readonly nodeType: UnsupportedControlNodeType;
	readonly appearances: UnknownAppearanceDefinition;
	readonly definition: UnsupportedControlDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: UnsupportedControlNodeState;
	readonly validationState: LeafNodeValidationState;

	setValue?(value: never): never;
}
