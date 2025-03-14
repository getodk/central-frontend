import type { AnyFunction } from '@getodk/common/types/helpers.js';
import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type {
	FailedLoadFormResultMethod,
	LoadFormFailureResult,
	LoadFormWarnings,
} from '../../client/form/LoadFormResult.ts';
import { LoadFormFailureError } from '../../error/LoadFormFailureError.ts';
import { BaseFormResult } from './BaseFormResult.ts';

interface FormFailureOptions {
	readonly error: LoadFormFailureError;
	readonly warnings: LoadFormWarnings | null;
}

const failedFormResultMethodFactory = <T extends AnyFunction>(
	cause: LoadFormFailureError
): FailedLoadFormResultMethod<T> => {
	return () => {
		throw new Error(cause.message, { cause });
	};
};

export class FormFailureResult extends BaseFormResult<'failure'> implements LoadFormFailureResult {
	readonly createInstance: FailedLoadFormResultMethod<CreateFormInstance>;

	constructor(options: FormFailureOptions) {
		const { error, warnings } = options;

		super({
			status: 'failure',
			warnings,
			error,
		});

		this.createInstance = failedFormResultMethodFactory(error);
	}
}
