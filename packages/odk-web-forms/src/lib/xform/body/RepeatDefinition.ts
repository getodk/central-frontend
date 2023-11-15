import type { XFormDefinition } from '../XFormDefinition.ts';
import type { BodyElementDefinitionArray } from './BodyDefinition.ts';
import { BodyElementDefinition } from './BodyElementDefinition.ts';
import type { RepeatGroupDefinition } from './group/RepeatGroupDefinition.ts';

export class RepeatDefinition extends BodyElementDefinition<'repeat'> {
	override readonly category = 'structure';
	readonly type = 'repeat';
	override readonly reference: string;

	readonly children: BodyElementDefinitionArray;

	constructor(
		form: XFormDefinition,
		readonly groupDefinition: RepeatGroupDefinition,
		element: Element
	) {
		super(form, element);

		const reference = element.getAttribute('nodeset');

		if (reference == null) {
			throw new Error('Invalid repeat: missing `nodeset` reference');
		}

		this.children = groupDefinition.getChildren(element);
		this.reference = reference;
	}

	override toJSON() {
		const { form, groupDefinition, ...rest } = this;

		return rest;
	}
}
