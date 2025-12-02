import type {
	AnyFormInstance,
	FetchFormAttachment,
	FetchResourceResponse,
	FormResource,
	MissingResourceBehavior,
	PreloadProperties,
	ResolvableFormInstance,
	ResolvableFormInstanceInput,
} from '@getodk/xforms-engine';
import { loadForm } from '@getodk/xforms-engine';
import { FormInitializationError } from '../error/FormInitializationError.ts';
import { ENGINE_FORM_INSTANCE_CONFIG } from './engine-config.ts';
import type {
	FormState,
	FormStateFailureResult,
	FormStateSuccessResult,
	InstantiableForm,
} from './form-state.ts';

const DEVICE_ID_KEY = 'odk-deviceid';
const DEVICE_ID_PREFIX = 'getodk.org:webforms:';

export interface FormOptions {
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
	readonly trackDevice?: boolean;
	readonly preloadProperties?: PreloadProperties;
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

const getDeviceId = () => {
	const id = localStorage.getItem(DEVICE_ID_KEY);
	if (id) {
		return id;
	}
	const deviceId = DEVICE_ID_PREFIX + crypto.randomUUID();
	localStorage.setItem(DEVICE_ID_KEY, deviceId);
	return deviceId;
};

const getFormInstanceConfig = (options: LoadFormStateOptions) => {
	const preloadProperties = {
		...options.preloadProperties,
	};
	if (!preloadProperties.deviceID && options.trackDevice) {
		preloadProperties.deviceID = getDeviceId();
	}
	return {
		...ENGINE_FORM_INSTANCE_CONFIG,
		preloadProperties,
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

	const config = getFormInstanceConfig(options);

	if (options.editInstance == null) {
		try {
			const instance = form.createInstance(config);

			return success(form, instance);
		} catch (cause) {
			return failure(FormInitializationError.from(cause));
		}
	}

	try {
		const instanceOptions = resolvableFormInstanceInput(options.editInstance);
		const instance = await form.editInstance(instanceOptions, config);

		return success(form, instance);
	} catch (cause) {
		return failure(FormInitializationError.from(cause));
	}
};
