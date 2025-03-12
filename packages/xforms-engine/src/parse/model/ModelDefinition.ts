import type { XFormDefinition } from '../XFormDefinition.ts';
import { ItextTranslationsDefinition } from './ItextTranslationsDefinition.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';
import { SubmissionDefinition } from './SubmissionDefinition.ts';

export class ModelDefinition {
	readonly binds: ModelBindMap;
	readonly root: RootDefinition;
	readonly itextTranslations: ItextTranslationsDefinition;

	constructor(readonly form: XFormDefinition) {
		const submission = new SubmissionDefinition(form.xformDOM);

		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this, submission, form.body.classes);
		this.itextTranslations = ItextTranslationsDefinition.from(form.xformDOM);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
