import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type { FormInstanceConfig } from '../../client/form/FormInstanceConfig.ts';
import type { FormResultStatus } from '../../client/form/LoadFormResult.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { FormInstanceBaseOptions, InstantiableFormResult } from '../FormInstance.ts';
import { FormInstance } from '../FormInstance.ts';
import type { BaseFormResultProperty } from './BaseFormResult.ts';
import { BaseFormResult } from './BaseFormResult.ts';

// prettier-ignore
export type InstantiableFormResultStatus =
	| 'success'
	| 'warning';

export interface BaseInstantiableFormResultOptions<Status extends InstantiableFormResultStatus> {
	readonly status: Status;
	readonly warnings: BaseFormResultProperty<Status, 'warnings'>;
	readonly error: null;
	readonly scope: ReactiveScope;
	readonly formResource: FormResource;
	readonly instanceOptions: FormInstanceBaseOptions;
}

export abstract class BaseInstantiableFormResult<
	Status extends InstantiableFormResultStatus,
> extends BaseFormResult<Status> {
	readonly createInstance: CreateFormInstance;

	constructor(options: BaseInstantiableFormResultOptions<Status>) {
		const { status, warnings, error, instanceOptions } = options;

		super({
			status,
			warnings,
			error,
		});

		this.createInstance = (instanceConfig: FormInstanceConfig = {}) => {
			this.assertInstantiable();

			return new FormInstance(this, {
				mode: 'create',
				instanceOptions,
				instanceConfig,
			});
		};
	}

	isInstantiable(): this is InstantiableFormResult {
		const self: BaseFormResult<FormResultStatus> = this satisfies BaseFormResult<FormResultStatus>;

		return self.status !== 'failure';
	}

	assertInstantiable(): asserts this is InstantiableFormResult {
		if (!this.isInstantiable()) {
			throw new ErrorProductionDesignPendingError(
				'Failed to instantiate from result with status: "failure"'
			);
		}
	}
}
