import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type { ResolvableInstanceAttachmentsMap } from '../../client/form/EditFormInstance.ts';
import { MalformedInstanceDataError } from '../../error/MalformedInstanceDataError.ts';

type InstanceAttachmentMapSourceEntry = readonly [key: string, value: FormDataEntryValue];

interface InstanceAttachmentMapSource {
	entries(): Iterable<InstanceAttachmentMapSourceEntry>;
}

type InstanceAttachmentMapSources = readonly [
	InstanceAttachmentMapSource,
	...InstanceAttachmentMapSource[],
];

/**
 * @todo This currently short-circuits if there are actually any instance
 * attachments to resolve. As described below, much of the approach is pretty
 * naive now anyway, and none of it is really "ready" until we have something to
 * actually _use the instance attachments_ once they're resolved! When we are
 * ready, the functionality can be unblocked as in
 * {@link https://github.com/getodk/web-forms/commit/88ee1b91c1f68d53ce9ba551bab334852e1e60cd | this commit}.
 *
 * @todo Everything about this is incredibly naive! We should almost certainly
 * do _at least_ the following:
 *
 * - Limit how many attachments we attempt to resolve concurrently
 * - Lazy resolution of large attachments (i.e. probably streaming, maybe range
 *   requests, ?)
 *
 * @todo Once lazy resolution is a thing, we will **also** need a clear path
 * from there to eager resolution (i.e. for offline caching: it doesn't make
 * sense to cache a stream in progress, as it won't load the resource once the
 * user actually is offline/lacks network access). This may be something we can
 * evolve gradually!
 */
const resolveInstanceAttachmentMapSource = async (
	input: ResolvableInstanceAttachmentsMap
): Promise<InstanceAttachmentMapSource> => {
	const inputEntries = Array.from(input.entries());

	if (inputEntries.length > 0) {
		const fileNames = Array.from(input.keys());
		const errors = fileNames.map((fileName) => {
			return new Error(`Failed to resolve instance attachment with file name "${fileName}"`);
		});

		throw new AggregateError(errors, 'Not implemented: instance attachment resource resolution');
	}

	const entries = await Promise.all<InstanceAttachmentMapSourceEntry>(
		inputEntries.map(async ([fileName, resolveAttachment]) => {
			const response = await resolveAttachment();
			const blob = await response.blob();
			const value = new File([blob], fileName);

			return [fileName, value] as const;
		})
	);

	return { entries: () => entries };
};

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
	static from(sources: InstanceAttachmentMapSources): InstanceAttachmentMap {
		return new this(sources);
	}

	/**
	 * @todo
	 * @see {@link resolveInstanceAttachmentMapSource}
	 */
	static async resolve(input: ResolvableInstanceAttachmentsMap): Promise<InstanceAttachmentMap> {
		const source = await resolveInstanceAttachmentMapSource(input);

		return new this([source]);
	}

	private constructor(sources: InstanceAttachmentMapSources) {
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
