import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { LabelDefinition } from '../parse/text/LabelDefinition.ts';
import { parseNodesetReference } from '../parse/xpath/reference-parsing.ts';
import type { BodyElementDefinitionArray, BodyElementParentContext } from './BodyDefinition.ts';
import { BodyDefinition } from './BodyDefinition.ts';
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

	// TODO: this will fall into the growing category of non-`BindExpression`
	// cases which have roughly the same design story.
	readonly countExpression: string | null;

	readonly isFixedCount: boolean;

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

		const childElements = Array.from(element.children).filter((childElement) => {
			const { localName } = childElement;

			return localName !== 'label' && localName !== 'group-label';
		});
		const children = BodyDefinition.getChildElementDefinitions(form, this, element, childElements);

		this.children = children;

		// Spec says this can be either `true()` or `false()`. That said, it
		// could also presumably be `true ( )` or whatever.
		const noAddRemove =
			element
				.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'noAddRemove')
				?.trim()
				.replaceAll(/\s+/g, '') ?? 'false()';

		// TODO: **probably** safe to disregard anything else?
		this.isFixedCount = noAddRemove === 'true()';
	}

	override toJSON() {
		const { form, parent, ...rest } = this;

		return rest;
	}
}
