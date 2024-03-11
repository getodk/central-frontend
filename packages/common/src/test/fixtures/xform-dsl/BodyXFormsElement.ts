import { emptyMap } from './collections.ts';
import { TagXFormsElement } from './TagXFormsElement.ts';
import type { XFormsElement } from './XFormsElement.ts';

export class BodyXFormsElement extends TagXFormsElement implements XFormsElement {
	override readonly name = 'h:body';

	constructor(children: readonly XFormsElement[]) {
		super('h:body', emptyMap(), children);
	}
}
