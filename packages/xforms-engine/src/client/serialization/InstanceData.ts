import type { INSTANCE_FILE_NAME, InstanceFile } from './InstanceFile.ts';

export type InstanceAttachmentFileName = string;

export interface InstanceData extends FormData {
	get(name: INSTANCE_FILE_NAME): InstanceFile;

	/**
	 * @todo Can we guarantee (both in static types and at runtime) that
	 * {@link InstanceData} only contains files?
	 */
	get(name: InstanceAttachmentFileName): FormDataEntryValue | null;

	has(name: INSTANCE_FILE_NAME): true;
	has(name: InstanceAttachmentFileName): boolean;
}
