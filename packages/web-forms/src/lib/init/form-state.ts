import type {
	AnyFormInstance,
	LoadFormSuccessResult,
	LoadFormWarningResult,
	RootNode,
} from '@getodk/xforms-engine';
import type { FormInitializationError } from '../error/FormInitializationError.ts';

/**
 * @todo We should probably export a type for this in the engine, both as a
 * convenience and to assign a stable name to the concept (which will probably
 * evolve when we address
 * {@link https://github.com/getodk/web-forms/issues/202 | error conditions} as
 * a holistic concern).
 */
export type InstantiableForm = LoadFormSuccessResult | LoadFormWarningResult;

export type FormStateFailureStatus = 'FORM_STATE_FAILURE';
export type FormStateLoadingStatus = 'FORM_STATE_LOADING';
export type FormStateSuccessStatus = 'FORM_STATE_SUCCESS';

export type FormStateStatus =
	| FormStateFailureStatus
	| FormStateLoadingStatus
	| FormStateSuccessStatus;

interface FormStateResult {
	readonly status: FormStateStatus;
	readonly error: FormInitializationError | null;
	readonly form: InstantiableForm | null;
	readonly instance: AnyFormInstance | null;
	readonly root: RootNode | null;
}

export interface FormStateFailureResult extends FormStateResult {
	readonly status: FormStateFailureStatus;
	readonly error: FormInitializationError;
	readonly form: null;
	readonly instance: null;
	readonly root: null;
}

export interface FormStateLoadingResult extends FormStateResult {
	readonly status: FormStateLoadingStatus;
	readonly error: null;
	readonly form: null;
	readonly instance: null;
	readonly root: null;
}

export interface FormStateSuccessResult extends FormStateResult {
	readonly status: FormStateSuccessStatus;
	readonly error: null;
	readonly form: InstantiableForm;
	readonly instance: AnyFormInstance;
	readonly root: RootNode;
}

// prettier-ignore
export type FormState =
	| FormStateFailureResult
	| FormStateLoadingResult
	| FormStateSuccessResult;
