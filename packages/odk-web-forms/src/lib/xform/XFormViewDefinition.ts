import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewChild } from './XFormViewChild.ts';

export class XFormViewDefinition {
	readonly children: readonly XFormViewChild[];

	constructor(protected readonly form: XFormDefinition) {
		this.children = XFormViewChild.children(form, form.xformDOM.body);
	}

	toJSON() {
		const { form, children, ...rest } = this;

		return {
			...rest,
			children: children.map((child) => child.toJSON()),
		};
	}
}
