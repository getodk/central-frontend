import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type { InstanceData } from '../../client/serialization/InstanceData.ts';
import { MalformedInstanceDataError } from '../../error/MalformedInstanceDataError.ts';

type InstanceAttachmentMapSources = readonly [InstanceData, ...InstanceData[]];

interface KeyedInstanceDataFile<Key extends string> extends File {
	readonly name: Key;
}

type AssertKeyedInstanceDataFile = <Key extends string>(
	key: Key,
	file: File
) => asserts file is KeyedInstanceDataFile<Key>;

const assertKeyedInstanceDataFile: AssertKeyedInstanceDataFile = (key, file) => {
	if (file.name !== key) {
		throw new MalformedInstanceDataError(
			`Unexpected InstanceData file. Expected file name to match key, got key: ${JSON.stringify(key)} and file name: ${JSON.stringify(file.name)}`
		);
	}
};

type UnknownInstanceDataEntry = readonly [key: string, value: FormDataEntryValue];

type KeyedInstanceDataEntry<Key extends string> = readonly [key: Key, KeyedInstanceDataFile<Key>];

type AssertInstanceDataEntry = <Key extends string>(
	entry: UnknownInstanceDataEntry
) => asserts entry is KeyedInstanceDataEntry<Key>;

const assertInstanceDataEntry: AssertInstanceDataEntry = (entry) => {
	const [key, value] = entry;

	if (!(value instanceof File)) {
		throw new MalformedInstanceDataError(
			`Unexpected non-file attachment in InstanceData for key: ${key}`
		);
	}

	assertKeyedInstanceDataFile(key, value);
};

export class InstanceAttachmentMap extends Map<string, File> {
	constructor(sources: InstanceAttachmentMapSources) {
		super();

		for (const source of sources) {
			for (const entry of source.entries()) {
				const [key] = entry;

				// Skip the instance XML file: it's not an attachment!
				if (key === INSTANCE_FILE_NAME) {
					continue;
				}

				if (this.has(key)) {
					throw new MalformedInstanceDataError(
						`Unexpected InstanceData entry. Duplicate instance attachment for key: ${JSON.stringify(key)}`
					);
				}

				assertInstanceDataEntry(entry);

				const [, value] = entry;

				this.set(key, value);
			}
		}
	}
}
