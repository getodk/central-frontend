import { UnreachableError } from '@odk-web-forms/common/lib/error/UnreachableError.ts';
import { SelectDefinition } from '../body/control/select/SelectDefinition.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../model/SubtreeDefinition.ts';
import { Group } from './Group.ts';
import { RepeatRange } from './RepeatRange.ts';
import { SelectField, type SelectFieldDefinition } from './SelectField.ts';
import { StringField } from './StringField.ts';
import { Subtree } from './Subtree.ts';
import type { GeneralChildNode, GeneralParentNode } from './hierarchy.ts';

const isSubtreeDefinition = (
	definition: ModelSubtreeDefinition
): definition is SubtreeDefinition => {
	return definition.bodyElement == null;
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

			case 'repeat-sequence': {
				return new RepeatRange(parent, child);
			}

			case 'value-node': {
				if (child.bodyElement instanceof SelectDefinition) {
					return new SelectField(parent, child as SelectFieldDefinition);
				}

				return new StringField(parent, child);
			}

			default: {
				throw new UnreachableError(child);
			}
		}
	});
};
