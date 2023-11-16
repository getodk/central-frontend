import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ReadonlyModelBindMap } from './ModelBindMap.ts';
import { ModelBindMap } from './ModelBindMap.ts';

export class ModelDefinition {
	readonly binds: ReadonlyModelBindMap;

	constructor(readonly form: XFormDefinition) {
		this.binds = ModelBindMap.fromModel(this);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
