import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
import type { RangeNodeDefinition } from '../client/unsupported/RangeNode.ts';
import type { RankNodeDefinition } from '../client/unsupported/RankNode.ts';
import type { TriggerNodeDefinition } from '../client/unsupported/TriggerNode.ts';
import type { UnsupportedControlDefinition } from '../client/unsupported/UnsupportedControlNode.ts';
import type { UploadNodeDefinition } from '../client/unsupported/UploadNode.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import { NoteNodeDefinition } from '../parse/model/NoteNodeDefinition.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../parse/model/SubtreeDefinition.ts';
import { Group } from './Group.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import { ModelValue, type ModelValueDefinition } from './ModelValue.ts';
import { Note } from './Note.ts';
import { RepeatRangeControlled } from './repeat/RepeatRangeControlled.ts';
import { RepeatRangeUncontrolled } from './repeat/RepeatRangeUncontrolled.ts';
import type { SelectFieldDefinition } from './SelectField.ts';
import { SelectField } from './SelectField.ts';
import type { StringFieldDefinition } from './StringField.ts';
import { StringField } from './StringField.ts';
import { Subtree } from './Subtree.ts';
import { RangeControl } from './unsupported/RangeControl.ts';
import { RankControl } from './unsupported/RankControl.ts';
import { TriggerControl } from './unsupported/TriggerControl.ts';
import { UploadControl } from './unsupported/UploadControl.ts';

const isSubtreeDefinition = (
	definition: ModelSubtreeDefinition
): definition is SubtreeDefinition => {
	return definition.bodyElement == null;
};

type AnyUnsupportedControlDefinition =
	| RangeNodeDefinition
	| RankNodeDefinition
	| TriggerNodeDefinition
	| UploadNodeDefinition;

// prettier-ignore
type ControlNodeDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| SelectFieldDefinition
	| StringFieldDefinition
	| AnyUnsupportedControlDefinition;

type AnyLeafNodeDefinition = ControlNodeDefinition | ModelValueDefinition;

const isModelValueDefinition = (
	definition: LeafNodeDefinition
): definition is ModelValueDefinition => {
	return definition.bodyElement == null;
};

const isStringFieldDefinition = (
	definition: ControlNodeDefinition
): definition is StringFieldDefinition => {
	return definition.bodyElement.type === 'input';
};

const isSelectFieldDefinition = (
	definition: ControlNodeDefinition
): definition is SelectFieldDefinition => {
	return definition.bodyElement.type === 'select' || definition.bodyElement.type === 'select1';
};

const isRangeNodeDefinition = (
	definition: UnsupportedControlDefinition
): definition is RangeNodeDefinition => {
	return definition.bodyElement.type === 'range';
};

const isRankNodeDefinition = (
	definition: UnsupportedControlDefinition
): definition is RankNodeDefinition => {
	return definition.bodyElement.type === 'rank';
};

const isTriggerNodeDefinition = (
	definition: ControlNodeDefinition
): definition is TriggerNodeDefinition => {
	return definition.bodyElement.type === 'trigger';
};

const isUploadNodeDefinition = (
	definition: ControlNodeDefinition
): definition is UploadNodeDefinition => {
	return definition.bodyElement.type === 'upload';
};

export const buildChildren = (parent: GeneralParentNode): GeneralChildNode[] => {
	const { children } = parent.definition;

	return children.map((child): GeneralChildNode => {
		switch (child.type) {
			case 'subtree': {
				if (isSubtreeDefinition(child)) {
					return new Subtree(parent, child);
				}

				// TODO: it'd be good to be able to do without this type assertion. The
				// only distinction between the types is whether `bodyElement` is
				// `null`, but for some reason that's insufficient to narrow the union.
				return new Group(parent, child as GroupDefinition);
			}

			case 'repeat-range': {
				if (child.isControlled()) {
					return new RepeatRangeControlled(parent, child);
				}

				return new RepeatRangeUncontrolled(parent, child);
			}

			case 'leaf-node': {
				if (child instanceof NoteNodeDefinition) {
					return new Note(parent, child);
				}

				// More specific type helps with narrowing below
				const leafChild: AnyLeafNodeDefinition = child;

				if (isModelValueDefinition(leafChild)) {
					return new ModelValue(parent, leafChild);
				}

				if (isStringFieldDefinition(leafChild)) {
					return new StringField(parent, leafChild);
				}

				if (isSelectFieldDefinition(leafChild)) {
					return new SelectField(parent, leafChild);
				}

				if (isRangeNodeDefinition(leafChild)) {
					return new RangeControl(parent, leafChild);
				}

				if (isRankNodeDefinition(leafChild)) {
					return new RankControl(parent, leafChild);
				}

				if (isTriggerNodeDefinition(leafChild)) {
					return new TriggerControl(parent, leafChild);
				}

				if (isUploadNodeDefinition(leafChild)) {
					return new UploadControl(parent, leafChild);
				}

				throw new UnreachableError(leafChild);
			}

			default: {
				throw new UnreachableError(child);
			}
		}
	});
};
