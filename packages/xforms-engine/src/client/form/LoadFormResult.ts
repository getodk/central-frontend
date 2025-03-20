import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type { AnyFunction } from '@getodk/common/types/helpers.js';
import type { LoadFormFailureError } from '../../error/LoadFormFailureError.ts';
import type { CreateFormInstance } from './CreateFormInstance.ts';
import type { EditFormInstance } from './EditFormInstance.ts';
import type { RestoreFormInstance } from './RestoreFormInstance.ts';

// Re-export for client access
export type { LoadFormFailureError };

// prettier-ignore
export type FormResultStatus =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'success'
	| 'warning'
	| 'failure';

/**
 * @todo Pending design and modeling of warning cases.
 */
export type LoadFormWarnings = UnknownObject;

// prettier-ignore
type FailedLoadFormResultMethodParameters<T extends AnyFunction> =
	& readonly never[]
	& (
			Parameters<T> extends { readonly length: infer Length extends number }
				? { readonly length: Length }
				: never
		);

export type FailedLoadFormResultMethod<T extends AnyFunction> = (
	...args: FailedLoadFormResultMethodParameters<T>
) => never;

// prettier-ignore
export type FallibleLoadFormResultMethod<T extends AnyFunction> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| T
	| FailedLoadFormResultMethod<T>;

interface BaseLoadFormResult {
	readonly status: FormResultStatus;
	readonly warnings: LoadFormWarnings | null;
	readonly error: LoadFormFailureError | null;
	readonly createInstance: FallibleLoadFormResultMethod<CreateFormInstance>;
	readonly editInstance: FallibleLoadFormResultMethod<EditFormInstance>;
	readonly restoreInstance: FallibleLoadFormResultMethod<RestoreFormInstance>;
}

export interface LoadFormSuccessResult extends BaseLoadFormResult {
	readonly status: 'success';
	readonly warnings: null;
	readonly error: null;
	readonly createInstance: CreateFormInstance;
	readonly editInstance: EditFormInstance;
	readonly restoreInstance: RestoreFormInstance;
}

export interface LoadFormWarningResult extends BaseLoadFormResult {
	readonly status: 'warning';
	readonly warnings: LoadFormWarnings;
	readonly error: null;
	readonly createInstance: CreateFormInstance;
	readonly editInstance: EditFormInstance;
	readonly restoreInstance: RestoreFormInstance;
}

export interface LoadFormFailureResult extends BaseLoadFormResult {
	readonly status: 'failure';
	readonly warnings: LoadFormWarnings | null;
	readonly error: LoadFormFailureError;

	/**
	 * @example A temporary demo integration was built during development of this
	 * interface.
	 *
	 * @see
	 * {@link https://github.com/getodk/web-forms/pull/345/commits/9ef36355d89dd1450d3a87c3a55506bb9b0fc414}
	 */
	readonly createInstance: FailedLoadFormResultMethod<CreateFormInstance>;

	readonly editInstance: FailedLoadFormResultMethod<EditFormInstance>;

	/**
	 * @example A temporary demo integration was built during development of this
	 * interface.
	 *
	 * @see
	 * {@link https://github.com/getodk/web-forms/pull/345/commits/9ef36355d89dd1450d3a87c3a55506bb9b0fc414}
	 */
	readonly restoreInstance: FailedLoadFormResultMethod<RestoreFormInstance>;
}

// prettier-ignore
export type InstantiableLoadFormResult =
	| LoadFormSuccessResult
	| LoadFormWarningResult

// prettier-ignore
export type LoadFormResult =
	| InstantiableLoadFormResult
	| LoadFormFailureResult;
