import type { XFormDefinition } from '../XFormDefinition.ts';
import { FormSubmissionDefinition } from './FormSubmissionDefinition.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';

export class ModelDefinition {
	readonly binds: ModelBindMap;
	readonly root: RootDefinition;

	constructor(readonly form: XFormDefinition) {
		const submission = new FormSubmissionDefinition(form.xformDOM);
		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this, submission, form.body.classes);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
