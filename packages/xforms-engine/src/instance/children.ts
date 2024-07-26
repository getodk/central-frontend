import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
import type { LeafNodeDefinition } from '../model/LeafNodeDefinition.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../model/SubtreeDefinition.ts';
import { NoteNodeDefinition } from '../parse/NoteNodeDefinition.ts';
import { Group } from './Group.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';
import { ModelValue, type ModelValueDefinition } from './ModelValue.ts';
import { Note } from './Note.ts';
import { RepeatRange } from './RepeatRange.ts';
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
				return new RepeatRange(parent, child);
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
