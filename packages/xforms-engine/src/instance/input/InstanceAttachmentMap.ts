import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type {
	ResolvableInstanceAttachmentsMap,
	ResolveFormInstanceResource,
} from '../../client/form/EditFormInstance.ts';
import type { InstanceData } from '../../client/index.ts';
import { MalformedInstanceDataError } from '../../error/MalformedInstanceDataError.ts';
import { getResponseContentType } from '../../lib/resource-helpers.ts';
import type { FetchResourceResponse } from '../resource.ts';

type InstanceAttachmentMapSourceEntry = readonly [key: string, value: Promise<File>];

const DEFAULT_ATTACHMENT_TYPE = 'application/octet-stream';

const resolveContentType = (response: FetchResourceResponse, blob: Blob): string => {
	let result = blob.type;

	if (result === '') {
		result = getResponseContentType(response) ?? result;
	}

	if (result === '') {
		return DEFAULT_ATTACHMENT_TYPE;
	}

	return result;
};

const resolveInstanceAttachmentFile = async (
	resolveAttachment: ResolveFormInstanceResource,
	fileName: string
): Promise<File> => {
	const response = await resolveAttachment();
	if (!response.ok) {
		return Promise.reject(new Error(`Error fetching instance attachment, code ${response.status}`));
	}
	const blob = await response.blob();
	const blobData = await getBlobData(blob);

	return new File([blobData], fileName, {
		type: resolveContentType(response, blob),
	});
};

export class InstanceAttachmentMap extends Map<string, Promise<File>> {
	private resolvable: ResolvableInstanceAttachmentsMap | undefined;

	static from(sources: readonly InstanceData[]): InstanceAttachmentMap {
		const entries: InstanceAttachmentMapSourceEntry[] = [];
		for (const source of sources) {
			for (const entry of source.entries()) {
				const [key, value] = entry;
				entries.push([key, Promise.resolve(value)]);
			}
		}

		return new this(entries);
	}

	static resolve(input: ResolvableInstanceAttachmentsMap): InstanceAttachmentMap {
		const entries = Array.from(input.entries()).map(([fileName, resolveAttachment]) => {
			const value = resolveInstanceAttachmentFile(resolveAttachment, fileName);
			return [fileName, value] as const;
		});

		const map = new this(entries);
		map.setResolvable(input);
		return map;
	}

	retry(fileName: string) {
		const resolveAttachment = this.resolvable?.get(fileName);
		if (resolveAttachment) {
			const value = resolveInstanceAttachmentFile(resolveAttachment, fileName);
			this.set(fileName, value);
		}
	}

	private setResolvable(input: ResolvableInstanceAttachmentsMap) {
		this.resolvable = input;
	}

	private constructor(entries: readonly InstanceAttachmentMapSourceEntry[]) {
		super();
		for (const entry of entries) {
			const [key, value] = entry;
			// Skip the instance XML file: it's not an attachment!
			if (key === INSTANCE_FILE_NAME) {
				continue;
			}
			if (this.has(key)) {
				throw new MalformedInstanceDataError(
					`Unexpected InstanceData entry. Duplicate instance attachment for key: ${JSON.stringify(key)}`
				);
			}
			this.set(key, value);
		}
	}
}
