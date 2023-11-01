import type { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import { XFormViewChild } from './XFormViewChild.ts';

export class XFormViewDefinition {
	readonly children: readonly XFormViewChild[];

	constructor(
		protected readonly form: XFormDefinition,
		evaluator: XFormXPathEvaluator
	) {
		const bodyElement = evaluator.evaluateNonNullElement('/h:html/h:body');

		this.children = XFormViewChild.children(form, bodyElement);
	}

	toJSON() {
		const { form, children, ...rest } = this;

		return {
			...rest,
			children: children.map((child) => child.toJSON()),
		};
	}
}
