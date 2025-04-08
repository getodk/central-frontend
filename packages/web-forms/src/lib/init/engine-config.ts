import type {
	EditFormInstance,
	FormInstanceConfig,
	InstanceAttachmentsConfig,
	InstancePayload,
} from '@getodk/xforms-engine';
import { reactive } from 'vue';

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

export const ENGINE_FORM_INSTANCE_CONFIG: FormInstanceConfig = {
	stateFactory: reactive,
	instanceAttachments: INSTANCE_ATTACHMENTS_CONFIG,
};
