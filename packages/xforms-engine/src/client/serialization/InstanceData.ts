import type { INSTANCE_FILE_NAME, InstanceFile } from './InstanceFile.ts';

export type InstanceAttachmentFileName = string;

export type InstanceDataEntryValue = File;

export interface InstanceData extends FormData {
	[Symbol.iterator](): FormDataIterator<[string, InstanceDataEntryValue]>;
	entries(): FormDataIterator<[string, InstanceDataEntryValue]>;
	values(): FormDataIterator<InstanceDataEntryValue>;

	forEach(
		callbackfn: (value: InstanceDataEntryValue, key: string, parent: InstanceData) => void,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		thisArg?: any
	): void;

	get(name: INSTANCE_FILE_NAME): InstanceFile;
	get(name: InstanceAttachmentFileName): InstanceDataEntryValue | null;
	getAll(name: string): InstanceDataEntryValue[];

	has(name: INSTANCE_FILE_NAME): true;
	has(name: InstanceAttachmentFileName): boolean;
}
