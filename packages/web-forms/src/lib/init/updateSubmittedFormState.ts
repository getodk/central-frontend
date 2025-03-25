import { POST_SUBMIT__NEW_INSTANCE } from '../constants/control-flow.ts';
import type { OptionalHostSubmissionResult } from '../submission/HostSubmissionResultCallback.ts';
import { ENGINE_FORM_INSTANCE_CONFIG } from './engine-config.ts';
import type { FormStateSuccessResult } from './FormState.ts';

/**
 * @todo Clean up {@link currentState}'s {@link FormStateSuccessResult.instance}
 * before creating a new one. (Requires engine support, but will need to be
 * invoked here!)
 */
const resetInstanceState = (currentState: FormStateSuccessResult): FormStateSuccessResult => {
	const { form } = currentState;
	const instance = form.createInstance(ENGINE_FORM_INSTANCE_CONFIG);

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
	currentState: FormStateSuccessResult
): FormStateSuccessResult => {
	if (submissionResult?.next === POST_SUBMIT__NEW_INSTANCE) {
		return resetInstanceState(currentState);
	}

	return currentState;
};
