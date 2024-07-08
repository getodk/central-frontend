import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import { getLabelElement } from '../../lib/dom/query.ts';
import { LabelDefinition } from '../../parse/text/LabelDefinition.ts';
import { parseNodesetReference } from '../../parse/xpath/reference-parsing.ts';
import {
	BodyDefinition,
	type BodyElementDefinitionArray,
	type BodyElementParentContext,
} from '../BodyDefinition.ts';
import { BodyElementDefinition } from '../BodyElementDefinition.ts';
import type { StructureElementAppearanceDefinition } from '../appearance/structureElementAppearanceParser.ts';
import { structureElementAppearanceParser } from '../appearance/structureElementAppearanceParser.ts';

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
 * - `structural-group` is any `<group>` element which does not satisfy any of
 *   the other usage scenarios; this isn't exactly the terminology used, but is
 *   the most closely fitting name for the concept where the other sceanarios
 *   do not apply
 *
 * A more succinct decision tree:
 *
 * - `<group ref="$ref">` -> `logical-group`, else
 * - `<group><label>` -> `presentation-group`, else
 * - `<group>` -> `structural-group`
 */
export type GroupType = 'logical-group' | 'presentation-group' | 'structural-group';

export abstract class BaseGroupDefinition<
	Type extends GroupType,
> extends BodyElementDefinition<Type> {
	// TODO: does this really accomplish anything? It seems highly unlikely it
	// has enough performance benefit to outweigh its memory and lookup costs.
	private static groupTypes = new UpsertableMap<Element, GroupType | null>();

	protected static getGroupType(localName: string, element: Element): GroupType | null {
		return this.groupTypes.upsert(element, () => {
			if (localName !== 'group') {
				return null;
			}

			if (element.hasAttribute('ref')) {
				return 'logical-group';
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
	readonly appearances: StructureElementAppearanceDefinition;
	override readonly label: LabelDefinition | null;

	constructor(
		form: XFormDefinition,
		parent: BodyElementParentContext,
		element: Element,
		children?: BodyElementDefinitionArray
	) {
		super(form, parent, element);

		this.children = children ?? this.getChildren(element);
		this.reference = parseNodesetReference(parent, element, 'ref');
		this.appearances = structureElementAppearanceParser.parseFrom(element, 'appearance');
		this.label = LabelDefinition.forGroup(form, this);
	}

	getChildren(element: Element): BodyElementDefinitionArray {
		const { form } = this;
		const children = Array.from(element.children).filter((child) => {
			const childName = child.localName;

			return childName !== 'label';
		});

		return BodyDefinition.getChildElementDefinitions(form, this, element, children);
	}
}
