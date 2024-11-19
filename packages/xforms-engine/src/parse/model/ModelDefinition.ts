import type { XFormDefinition } from '../XFormDefinition.ts';
import { FormSubmissionDefinition } from './FormSubmissionDefinition.ts';
import { ItextTranslationsDefinition } from './ItextTranslation/ItextTranslationsDefinition.ts';
import { ModelBindMap } from './ModelBindMap.ts';
import { RootDefinition } from './RootDefinition.ts';
import { SecondaryInstancesDefinition } from './SecondaryInstance/SecondaryInstancesDefinition.ts';

export class ModelDefinition {
	readonly binds: ModelBindMap;
	readonly root: RootDefinition;
	readonly itextTranslations: ItextTranslationsDefinition;
	readonly secondaryInstances: SecondaryInstancesDefinition;

	constructor(readonly form: XFormDefinition) {
		const submission = new FormSubmissionDefinition(form.xformDOM);
		this.binds = ModelBindMap.fromModel(this);
		this.root = new RootDefinition(form, this, submission, form.body.classes);
		this.itextTranslations = ItextTranslationsDefinition.from(form.xformDOM);
		this.secondaryInstances = SecondaryInstancesDefinition.from(form.xformDOM);
	}

	toJSON() {
		const { form, ...rest } = this;

		return rest;
	}
}
