import type { INSTANCE_FILE_NAME, InstanceFile } from './InstanceFile.ts';

export interface InstanceData extends FormData {
	get(name: INSTANCE_FILE_NAME): InstanceFile;

	/**
	 * @todo Can we guarantee (both in static types and at runtime) that
	 * {@link InstanceData} only contains files?
	 */
	get(name: string): FormDataEntryValue | null;

	has(name: INSTANCE_FILE_NAME): true;
	has(name: string): boolean;
}
