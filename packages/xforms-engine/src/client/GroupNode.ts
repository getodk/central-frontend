import type { AnyGroupElementDefinition } from '../body/BodyDefinition.ts';
import type { SubtreeDefinition } from '../model/SubtreeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import type { AncestorNodeValidationState } from './validation.ts';

export interface GroupNodeState extends BaseNodeState {
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

// TODO: as with `SubtreeNode`'s `SubtreeDefinition`, there is a naming
// inconsistency emerging here.
export interface GroupDefinition extends SubtreeDefinition {
	readonly bodyElement: AnyGroupElementDefinition;
}

export type GroupNodeAppearances = NodeAppearances<GroupDefinition>;

/**
 * A node corresponding to an XForms `<group>`.
 */
// TODO: test (fix?) case where a `<group>` is implicitly connected to a
// subtree, but doesn't reference it directly. See
// https://github.com/getodk/web-forms/blob/6cfff8b4c5a2cf6a23a71ef6d4308343bccd2436/packages/odk-web-forms/src/lib/xform/model/ModelDefinition.test.ts#L480-L540
// for context.
export interface GroupNode extends BaseNode {
	readonly nodeType: 'group';
	readonly appearances: GroupNodeAppearances;
	readonly definition: GroupDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: GroupNodeState;
	readonly validationState: AncestorNodeValidationState;
}
