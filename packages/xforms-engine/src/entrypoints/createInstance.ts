import type { CreatedFormInstance } from '../client/form/CreateFormInstance.ts';
import type { FormInstanceConfig } from '../client/form/FormInstanceConfig.ts';
import type { LoadFormOptions } from '../client/form/LoadForm.ts';
import type { FormResource } from '../instance/resource.ts';
import { loadForm } from './loadForm.ts';

export interface CreateInstanceOptions {
	readonly form?: LoadFormOptions;
	readonly instance?: FormInstanceConfig;
}

export const createInstance = async (
	formResource: FormResource,
	options?: CreateInstanceOptions
): Promise<CreatedFormInstance> => {
	const form = await loadForm(formResource, options?.form);

	if (form.status === 'failure') {
		throw form.error;
	}

	return form.createInstance(options?.instance);
};
