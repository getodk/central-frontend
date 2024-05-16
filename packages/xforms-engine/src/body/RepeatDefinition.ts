import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyElementDefinitionArray } from './BodyDefinition.ts';
import { BodyElementDefinition } from './BodyElementDefinition.ts';
import type { RepeatGroupDefinition } from './group/RepeatGroupDefinition.ts';

export class RepeatDefinition extends BodyElementDefinition<'repeat'> {
	override readonly category = 'structure';
	readonly type = 'repeat';
	override readonly reference: string;

	// TODO: this will fall into the growing category of non-`BindExpression`
	// cases which have roughly the same design story.
	readonly countExpression: string | null;

	readonly isFixedCount: boolean;

	readonly children: BodyElementDefinitionArray;

	constructor(
		form: XFormDefinition,
		readonly groupDefinition: RepeatGroupDefinition,
		element: Element
	) {
		super(form, groupDefinition, element);

		const reference = element.getAttribute('nodeset');

		if (reference == null) {
			throw new Error('Invalid repeat: missing `nodeset` reference');
		}

		this.reference = reference;
		this.countExpression = element.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'count');
		this.children = groupDefinition.getChildren(element);

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
		const { form, groupDefinition, parent, ...rest } = this;

		return rest;
	}
}
