import { LabelDefinition } from '../text/LabelDefinition.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { parseNodesetReference } from '../xpath/reference-parsing.ts';
import type { StructureElementAppearanceDefinition } from './appearance/structureElementAppearanceParser.ts';
import { structureElementAppearanceParser } from './appearance/structureElementAppearanceParser.ts';
import {
	type BodyElementDefinitionArray,
	type BodyElementParentContext,
} from './BodyDefinition.ts';
import { BodyElementDefinition } from './BodyElementDefinition.ts';

/**
 * As per the spec: https://getodk.github.io/xforms-spec/#groups
 *
 * A group combines elements together.
 * The group can have a label, and if so is referred to as a "presentation group".
 * The group can have a ref, and if so is referred to as a "logical group".
 */
export class GroupElementDefinition extends BodyElementDefinition<'group'> {
	override readonly category = 'structure';
	override readonly type = 'group';

	readonly children: BodyElementDefinitionArray;

	override readonly reference: string | null;
	readonly appearances: StructureElementAppearanceDefinition;
	override readonly label: LabelDefinition | null;

	static override isCompatible(localName: string): boolean {
		return localName === 'group';
	}

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		const childElements = Array.from(element.children).filter((child) => {
			const childName = child.localName;

			return childName !== 'label';
		});

		this.children = this.body.getChildElementDefinitions(form, this, element, childElements);
		this.reference = parseNodesetReference(parent, element, 'ref');
		this.appearances = structureElementAppearanceParser.parseFrom(element, 'appearance');
		this.label = LabelDefinition.forGroup(form, this);
	}
}
