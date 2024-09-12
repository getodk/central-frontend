import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
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

const isSubtreeDefinition = (
	definition: ModelSubtreeDefinition
): definition is SubtreeDefinition => {
	return definition.bodyElement == null;
};

type ControlNodeDefinition = SelectFieldDefinition | StringFieldDefinition;

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

				return new SelectField(parent, leafChild);
			}

			default: {
				throw new UnreachableError(child);
			}
		}
	});
};
