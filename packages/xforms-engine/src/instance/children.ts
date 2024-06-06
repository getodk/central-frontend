import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { GroupDefinition } from '../client/GroupNode.ts';
import type { SubtreeDefinition } from '../client/SubtreeNode.ts';
import type { SubtreeDefinition as ModelSubtreeDefinition } from '../model/SubtreeDefinition.ts';
import { Group } from './Group.ts';
import { RepeatRange } from './RepeatRange.ts';
import type { SelectFieldDefinition } from './SelectField.ts';
import { SelectField } from './SelectField.ts';
import type { StringFieldDefinition } from './StringField.ts';
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

			case 'repeat-range': {
				return new RepeatRange(parent, child);
			}

			case 'value-node': {
				// TODO: this sort of awkwardness might go away if we embrace a
				// proliferation of node types throughout.
				switch (child.bodyElement?.type) {
					case 'select':
					case 'select1':
						return new SelectField(parent, child as SelectFieldDefinition);

					case 'input':
					case undefined:
						return new StringField(parent, child as StringFieldDefinition);

					default:
						throw new UnreachableError(child.bodyElement);
				}
			}

			default: {
				throw new UnreachableError(child);
			}
		}
	});
};
