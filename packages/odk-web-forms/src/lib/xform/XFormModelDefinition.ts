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

	constructor(readonly form: XFormDefinition) {
		this.binds = XFormModelBindMap.fromModel(this);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
