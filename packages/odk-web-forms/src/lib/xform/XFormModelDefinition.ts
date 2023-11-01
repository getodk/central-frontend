import { XFormXPathEvaluator } from '../xpath/XFormXPathEvaluator.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { ReadonlyXFormModelBindMap } from './XFormModelBindMap.ts';
import { XFormModelBindMap } from './XFormModelBindMap.ts';

export interface XFormModelDefinitionCommonElements {
	readonly model: Element;
	readonly primaryInstance: Element;
	readonly primaryInstanceRoot: Element;
}

export class XFormModelDefinition {
	protected readonly primaryInstanceEvaluator: XFormXPathEvaluator;

	readonly binds: ReadonlyXFormModelBindMap;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly commonElements: XFormModelDefinitionCommonElements
	) {
		this.binds = XFormModelBindMap.fromModel(form, this, commonElements.model);
		this.primaryInstanceEvaluator = new XFormXPathEvaluator(commonElements.primaryInstance);
	}

	toJSON() {
		const { form, primaryInstanceEvaluator, ...rest } = this;

		return rest;
	}
}
