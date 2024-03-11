import { emptyMap } from './collections.ts';
import { TagXFormsElement } from './TagXFormsElement.ts';
import type { XFormsElement } from './XFormsElement.ts';

export class HeadXFormsElement extends TagXFormsElement implements XFormsElement {
	override readonly name = 'h:head';

	constructor(children: readonly XFormsElement[]) {
		super('h:head', emptyMap(), children);
	}
}
