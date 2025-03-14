import type { LoadFormSuccessResult } from '../../client/index.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { FormInstanceBaseOptions } from '../FormInstance.ts';
import { BaseInstantiableFormResult } from './BaseInstantiableFormResult.ts';

export interface FormSuccessResultOptions {
	readonly warnings: null;
	readonly error: null;
	readonly scope: ReactiveScope;
	readonly formResource: FormResource;
	readonly instanceOptions: FormInstanceBaseOptions;
}

export class FormSuccessResult
	extends BaseInstantiableFormResult<'success'>
	implements LoadFormSuccessResult
{
	constructor(options: FormSuccessResultOptions) {
		super({
			status: 'success',
			...options,
		});
	}
}
