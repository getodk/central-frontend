import { POST_SUBMIT__NEW_INSTANCE } from '@/lib/constants/control-flow.ts';
import type { OptionalHostSubmissionResult } from '@/lib/submission/host-submission-result-callback.ts';
import type { PreloadProperties } from '@getodk/xforms-engine';
import { getFormInstanceConfig } from './engine-config.ts';
import type { FormStateSuccessResult } from './form-state.ts';

interface ResetFormStateOptions {
	readonly trackDevice?: boolean;
	readonly preloadProperties?: PreloadProperties;
}

const resetInstanceState = (
	currentState: FormStateSuccessResult,
	options: ResetFormStateOptions
): FormStateSuccessResult => {
	const { form } = currentState;
	const instanceConfig = getFormInstanceConfig(options);
	const instance = form.resetInstance(instanceConfig);
	return {
		status: 'FORM_STATE_SUCCESS',
		error: null,
		form,
		instance,
		root: instance.root,
	};
};

export const updateSubmittedFormState = (
	submissionResult: OptionalHostSubmissionResult,
	currentState: FormStateSuccessResult,
	options: ResetFormStateOptions
): FormStateSuccessResult => {
	if (submissionResult?.next === POST_SUBMIT__NEW_INSTANCE) {
		return resetInstanceState(currentState, options);
	}

	return currentState;
};
