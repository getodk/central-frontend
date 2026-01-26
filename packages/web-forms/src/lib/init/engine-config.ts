import type { FormOptions } from '@/lib/init/load-form-state.ts';
import type {
	EditFormInstance,
	InstanceAttachmentsConfig,
	InstancePayload,
	PreloadProperties,
} from '@getodk/xforms-engine';
import { reactive } from 'vue';

const DEVICE_ID_KEY = 'odk-deviceid';
const DEVICE_ID_PREFIX = 'getodk.org:webforms:';

interface GetFormInstanceConfigOptions {
	readonly form: FormOptions;
	readonly trackDevice?: boolean;
	readonly preloadProperties?: PreloadProperties;
}

/**
 * At present, the Web Forms strategy for producing distinct instance attachment
 * file names concatenates:
 *
 * - The current time in milliseconds
 * - The instance attachment's original file extension (if available)
 *
 * Important: this strategy is applied **only** on writes occurring after form
 * load. Instance attachments present at the time a form is loaded (i.e. from an
 * {@link InstancePayload} passed to {@link ResolvableFormInstance}, or the
 * I/O-capable equivalent passed to {@link EditFormInstance}) will retain the
 * file name which was supplied at that time.
 *
 * Note: This logic has been ported directly from
 * {@link https://github.com/getodk/collect/blob/ca16422060d0e46303d427112e6a511947e33626/collect_app/src/main/java/org/odk/collect/android/utilities/FileUtils.java#L77 | Collect},
 * except that Web Forms does not (and cannot) specify any file's containing
 * directory path.
 */
const INSTANCE_ATTACHMENTS_CONFIG: InstanceAttachmentsConfig = {
	fileNameFactory: (meta) => {
		const { writtenAt, extension } = meta;

		return `${writtenAt.getTime()}${extension ?? ''}`;
	},
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

const getPreloadProperties = (options: GetFormInstanceConfigOptions) => {
	if (!options.trackDevice || options.preloadProperties?.deviceID) {
		return options.preloadProperties;
	}
	return {
		...options.preloadProperties,
		deviceID: getDeviceId(),
	};
};

export const getFormInstanceConfig = (options: GetFormInstanceConfigOptions) => {
	return {
		stateFactory: reactive,
		instanceAttachments: INSTANCE_ATTACHMENTS_CONFIG,
		preloadProperties: getPreloadProperties(options),
		geolocationProvider: options.form.geolocationProvider,
	};
};
