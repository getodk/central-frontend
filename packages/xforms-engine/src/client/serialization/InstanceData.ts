import type { INSTANCE_FILE_NAME, InstanceFile } from './InstanceFile.ts';

export interface InstanceData extends FormData {
	get(name: INSTANCE_FILE_NAME): InstanceFile;
	get(name: string): FormDataEntryValue | null;

	has(name: INSTANCE_FILE_NAME): true;
	has(name: string): boolean;
}
