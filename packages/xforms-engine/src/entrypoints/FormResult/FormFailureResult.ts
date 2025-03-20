import type { AnyFunction } from '@getodk/common/types/helpers.js';
import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type { EditFormInstance } from '../../client/form/EditFormInstance.ts';
import type {
	FailedLoadFormResultMethod,
	LoadFormFailureResult,
	LoadFormWarnings,
} from '../../client/form/LoadFormResult.ts';
import type { RestoreFormInstance } from '../../client/form/RestoreFormInstance.ts';
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
	readonly editInstance: FailedLoadFormResultMethod<EditFormInstance>;
	readonly restoreInstance: FailedLoadFormResultMethod<RestoreFormInstance>;

	constructor(options: FormFailureOptions) {
		const { error, warnings } = options;

		super({
			status: 'failure',
			warnings,
			error,
		});

		this.createInstance = failedFormResultMethodFactory(error);
		this.editInstance = failedFormResultMethodFactory(error);
		this.restoreInstance = failedFormResultMethodFactory(error);
	}
}
