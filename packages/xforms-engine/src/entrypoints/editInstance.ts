import type { EditedFormInstance, EditFormInstanceInput } from '../client/form/EditFormInstance.ts';
import type { FormInstanceConfig } from '../client/form/FormInstanceConfig.ts';
import type { LoadFormOptions } from '../client/form/LoadForm.ts';
import type { FormResource } from '../instance/resource.ts';
import { loadForm } from './loadForm.ts';

export interface EditInstanceOptions {
	readonly form?: LoadFormOptions;
	readonly instance?: FormInstanceConfig;
}

export const editInstance = async (
	formResource: FormResource,
	input: EditFormInstanceInput,
	options?: EditInstanceOptions
): Promise<EditedFormInstance> => {
	const form = await loadForm(formResource, options?.form);

	if (form.status === 'failure') {
		throw form.error;
	}

	return form.editInstance(input, options?.instance);
};
