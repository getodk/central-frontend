import type {
	AnyFormInstance,
	FetchFormAttachment,
	FetchResourceResponse,
	FormResource,
	MissingResourceBehavior,
	ResolvableFormInstance,
	ResolvableFormInstanceInput,
} from '@getodk/xforms-engine';
import { loadForm } from '@getodk/xforms-engine';
import { FormInitializationError } from '../error/FormInitializationError.ts';
import type {
	FormState,
	FormStateFailureResult,
	FormStateSuccessResult,
	InstantiableForm,
} from './FormState.ts';
import { ENGINE_FORM_INSTANCE_CONFIG } from './engine-config.ts';

interface FormOptions {
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly missingResourceBehavior?: MissingResourceBehavior;
}

export type ResolveInstanceAttachment = (fileName: string) => Promise<FetchResourceResponse>;

export interface EditInstanceOptions {
	readonly resolveInstance: ResolvableFormInstance;
	readonly attachmentFileNames: readonly string[];
	readonly resolveAttachment: ResolveInstanceAttachment;
}

/**
 * Converts host app-facing {@link EditInstanceOptions} to engine's
 * {@link ResolveFormInstanceResource}, by mapping... a mapping... to a
 * {@link Map}.
 */
const resolvableFormInstanceInput = (options: EditInstanceOptions): ResolvableFormInstanceInput => {
	const {
		/**
		 * We can pass this through directly...
		 */
		resolveInstance,

		/**
		 * ... but we need to take these keys that the host application gave us,
		 * and ask the host application for the values associated with those keys.
		 *
		 * (Per feedback from Central team.)
		 */
		attachmentFileNames,
		resolveAttachment,
	} = options;

	return {
		inputType: 'FORM_INSTANCE_INPUT_RESOLVABLE',
		resolveInstance,
		attachments: new Map(
			attachmentFileNames.map((fileName) => {
				return [fileName, () => resolveAttachment(fileName)];
			})
		),
	};
};

interface LoadFormStateOptions {
	readonly form: FormOptions;
	readonly editInstance?: EditInstanceOptions | null;
}

const failure = (error: FormInitializationError): FormStateFailureResult => {
	return {
		status: 'FORM_STATE_FAILURE',
		error,
		form: null,
		instance: null,
		root: null,
	};
};

const success = (form: InstantiableForm, instance: AnyFormInstance): FormStateSuccessResult => {
	return {
		status: 'FORM_STATE_SUCCESS',
		error: null,
		form,
		instance,
		root: instance.root,
	};
};

export const loadFormState = async (
	formResource: FormResource,
	options: LoadFormStateOptions
): Promise<FormState> => {
	const form = await loadForm(formResource, options.form);

	if (form.status === 'failure') {
		return failure(FormInitializationError.fromError(form.error));
	}

	if (options.editInstance == null) {
		try {
			const instance = form.createInstance(ENGINE_FORM_INSTANCE_CONFIG);

			return success(form, instance);
		} catch (cause) {
			return failure(FormInitializationError.from(cause));
		}
	}

	try {
		const instanceOptions = resolvableFormInstanceInput(options.editInstance);
		const instance = await form.editInstance(instanceOptions, ENGINE_FORM_INSTANCE_CONFIG);

		return success(form, instance);
	} catch (cause) {
		return failure(FormInitializationError.from(cause));
	}
};
