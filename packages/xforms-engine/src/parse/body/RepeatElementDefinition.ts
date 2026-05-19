import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type {
	BodyElementDefinitionArray,
	BodyElementParentContext,
} from '../body/BodyDefinition.ts';
import { LabelDefinition } from '../text/LabelDefinition.ts';
import { parseNodesetReference } from '../xpath/reference-parsing.ts';
import { BodyElementDefinition } from './BodyElementDefinition.ts';
import type { StructureElementAppearanceDefinition } from './appearance/structureElementAppearanceParser.ts';
import { structureElementAppearanceParser } from './appearance/structureElementAppearanceParser.ts';

export class RepeatElementDefinition extends BodyElementDefinition<'repeat'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'repeat';
	}

	override readonly category = 'structure';
	readonly type = 'repeat';
	override readonly reference: string;
	readonly appearances: StructureElementAppearanceDefinition;
	override readonly label: LabelDefinition | null;

	readonly countExpression: string | null;
	readonly noAddRemoveExpression: string | null;

	readonly children: BodyElementDefinitionArray;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.label = LabelDefinition.forRepeatGroup(form, this);

		const reference = parseNodesetReference(parent, element, 'nodeset');

		if (reference == null) {
			throw new Error('Invalid repeat: missing `nodeset` reference');
		}

		this.reference = reference;
		this.appearances = structureElementAppearanceParser.parseFrom(element, 'appearance');
		this.countExpression = element.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'count');
		this.noAddRemoveExpression = element.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'noAddRemove');

		const childElements = Array.from(element.children).filter((childElement) => {
			const { localName } = childElement;

			return localName !== 'label' && localName !== 'group-label';
		});
		const children = this.body.getChildElementDefinitions(form, this, element, childElements);

		this.children = children;
	}

	override toJSON() {
		const { form, parent, ...rest } = this;

		return rest;
	}
}
