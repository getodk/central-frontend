import { UpsertableMap } from '@odk/common/lib/collections/UpsertableMap.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- refrenced in JSDoc
import type { XFormDOM } from '../../XFormDOM.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getLabelElement, getRepeatElement } from '../../query.ts';
import {
	BodyDefinition,
	type BodyElementDefinitionArray,
	type BodyElementParentContext,
} from '../BodyDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import { LabelDefinition } from '../text/LabelDefinition.ts';

/**
 * These type names are derived from **and expand upon** the language used in
 * the ODK XForms spec to describe various group usage. Whereas the spec
 * language allows for a group to be described as more than one case, the intent
 * here is to establish exclusive naming which may or may not compound. As such:
 *
 * - `logical-group`, per spec language, is a group with a `ref`; its usage here
 *   differs from the spec language in that it _may_ have a `<label>` child but
 *   is not also treated as a `presentation-group` (which is only used for
 *   groups which do not have a `ref`)
 * - `presentation-group` is a group with a `<label>` child; its usage here
 *   differs from the spec language in that `presentation-group` does **not**
 *   have a `ref`
 * - `repeat-group` is not mentioned by the spec; it is an extension of
 *   `logical-group`, wherein its `ref` is the same as its immediate `<repeat>`
 *   child's `nodeset` (usage of each attribute is normalized during
 *   initialization, in {@link XFormDOM})
 * - `structural-group` is any `<group>` element which does not satisfy any of
 *   the other usage scenarios; this isn't exactly the terminology used, but is
 *   the most closely fitting name for the concept where the other sceanarios
 *   do not apply
 *
 * A more succinct decision tree:
 *
 * - `<group ref="$ref"><repeat nodeset="$ref">` -> `repeat-group`, else
 * - `<group ref="$ref">` -> `logical-group`, else
 * - `<group><label>` -> `presentation-group`, else
 * - `<group>` -> `structural-group`
 */
export type GroupType =
	| 'logical-group'
	| 'presentation-group'
	| 'repeat-group'
	| 'structural-group';

export abstract class BaseGroupDefinition<
	Type extends GroupType,
> extends BodyElementDefinition<Type> {
	private static groupTypes = new UpsertableMap<Element, GroupType | null>();

	protected static getGroupType(localName: string, element: Element): GroupType | null {
		return this.groupTypes.upsert(element, () => {
			if (localName !== 'group') {
				return null;
			}

			const ref = element.getAttribute('ref');

			if (ref != null) {
				const repeat = getRepeatElement(element);

				if (repeat == null) {
					return 'logical-group';
				}

				if (repeat.getAttribute('nodeset') === ref) {
					return 'repeat-group';
				}

				throw new Error('Unexpected <repeat> child of unrelated <group>');
			}

			const label = getLabelElement(element);

			if (label == null) {
				return 'structural-group';
			}

			return 'presentation-group';
		});
	}

	override readonly category = 'structure';

	readonly children: BodyElementDefinitionArray;

	override readonly reference: string | null;
	override readonly label: LabelDefinition | null;

	constructor(
		form: XFormDefinition,
		parent: BodyElementParentContext,
		element: Element,
		children?: BodyElementDefinitionArray
	) {
		super(form, parent, element);

		this.children = children ?? this.getChildren(element);
		this.reference = element.getAttribute('ref');
		this.label = LabelDefinition.forGroup(form, this);
	}

	getChildren(element: Element): BodyElementDefinitionArray {
		const { form } = this;
		const children = Array.from(element.children).filter((child) => {
			const childName = child.localName;

			return childName !== 'label' && childName !== 'repeat';
		});

		return BodyDefinition.getChildElementDefinitions(form, this, element, children);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const repeatGroup = <T extends BaseGroupDefinition<any>>(
	groupDefinition: T
): Extract<T, BaseGroupDefinition<'repeat-group'>> | null => {
	if (groupDefinition.type === 'repeat-group') {
		return groupDefinition as Extract<T, BaseGroupDefinition<'repeat-group'>>;
	}

	return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nonRepeatGroup = <T extends BaseGroupDefinition<any>>(
	groupDefinition: T
): Exclude<T, BaseGroupDefinition<'repeat-group'>> | null => {
	if (groupDefinition.type === 'repeat-group') {
		return null;
	}

	return groupDefinition as Exclude<T, BaseGroupDefinition<'repeat-group'>>;
};
