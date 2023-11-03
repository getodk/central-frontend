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
	readonly binds: ReadonlyXFormModelBindMap;
	readonly primaryInstanceEvaluator: XFormXPathEvaluator;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly commonElements: XFormModelDefinitionCommonElements
	) {
		this.primaryInstanceEvaluator = new XFormXPathEvaluator(commonElements.primaryInstance);
		this.binds = XFormModelBindMap.fromModel(form, this, commonElements.model);
	}

	toJSON() {
		const { form, primaryInstanceEvaluator, ...rest } = this;

		return rest;
	}
}
