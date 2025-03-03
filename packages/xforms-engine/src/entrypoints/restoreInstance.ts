import type { FormInstanceConfig } from '../client/form/FormInstanceConfig.ts';
import type { LoadFormOptions } from '../client/form/LoadForm.ts';
import type {
	RestoredFormInstance,
	RestoreFormInstanceInput,
} from '../client/form/RestoreFormInstance.ts';
import type { FormResource } from '../instance/resource.ts';
import { loadForm } from './loadForm.ts';

export interface RestoreInstanceOptions {
	readonly form?: LoadFormOptions;
	readonly instance?: FormInstanceConfig;
}

export const restoreInstance = async (
	formResource: FormResource,
	input: RestoreFormInstanceInput,
	options?: RestoreInstanceOptions
): Promise<RestoredFormInstance> => {
	const form = await loadForm(formResource, options?.form);

	if (form.status === 'failure') {
		throw form.error;
	}

	return form.restoreInstance(input, options?.instance);
};
