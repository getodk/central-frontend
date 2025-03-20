import type {
	FormResultStatus,
	LoadFormFailureResult,
	LoadFormResult,
	LoadFormSuccessResult,
	LoadFormWarningResult,
} from '../../client/form/LoadFormResult.ts';

interface LoadFormResultByStatus {
	readonly success: LoadFormSuccessResult;
	readonly warning: LoadFormWarningResult;
	readonly failure: LoadFormFailureResult;
}

export type BaseFormResultProperty<
	Status extends FormResultStatus,
	Key extends keyof LoadFormResult,
> = LoadFormResultByStatus[Status][Key];

export interface BaseFormResultOptions<Status extends FormResultStatus> {
	readonly status: Status;
	readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
	readonly error: BaseFormResultProperty<Status, 'error'>;
}

export abstract class BaseFormResult<Status extends FormResultStatus> {
	readonly status: Status;
	readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
	readonly error: BaseFormResultProperty<Status, 'error'>;

	abstract readonly createInstance: BaseFormResultProperty<Status, 'createInstance'>;
	abstract readonly editInstance: BaseFormResultProperty<Status, 'editInstance'>;
	abstract readonly restoreInstance: BaseFormResultProperty<Status, 'restoreInstance'>;

	constructor(options: BaseFormResultOptions<Status>) {
		this.status = options.status;
		this.warnings = options.warnings;
		this.error = options.error;
	}
}
