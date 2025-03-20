import type { CreateFormInstance } from '../../client/form/CreateFormInstance.ts';
import type {
	EditFormInstance,
	EditFormInstanceInput,
} from '../../client/form/EditFormInstance.ts';
import type { FormInstanceConfig } from '../../client/form/FormInstanceConfig.ts';
import type { FormResultStatus } from '../../client/form/LoadFormResult.ts';
import type {
	RestoreFormInstance,
	RestoreFormInstanceInput,
} from '../../client/form/RestoreFormInstance.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import { InitialInstanceState } from '../../instance/input/InitialInstanceState.ts';
import type { BasePrimaryInstanceOptions } from '../../instance/PrimaryInstance.ts';
import type { FormResource } from '../../instance/resource.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { InstantiableFormResult } from '../FormInstance.ts';
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
	readonly instanceOptions: BasePrimaryInstanceOptions;
}

export abstract class BaseInstantiableFormResult<
	Status extends InstantiableFormResultStatus,
> extends BaseFormResult<Status> {
	readonly createInstance: CreateFormInstance;
	readonly editInstance: EditFormInstance;
	readonly restoreInstance: RestoreFormInstance;

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
				initialState: null,
				instanceConfig,
			});
		};

		this.editInstance = async (
			input: EditFormInstanceInput,
			instanceConfig: FormInstanceConfig = {}
		) => {
			this.assertInstantiable();

			const initialState = await InitialInstanceState.resolve(instanceOptions.model, input);

			return new FormInstance(this, {
				mode: 'edit',
				instanceOptions,
				initialState,
				instanceConfig,
			});
		};

		this.restoreInstance = async (
			input: RestoreFormInstanceInput,
			instanceConfig: FormInstanceConfig = {}
		) => {
			this.assertInstantiable();

			const initialState = await InitialInstanceState.from(instanceOptions.model, input.data);

			return new FormInstance(this, {
				mode: 'restore',
				instanceOptions,
				initialState,
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
