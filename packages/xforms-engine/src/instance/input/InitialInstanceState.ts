import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type { InstanceData } from '../../client/serialization/InstanceData.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import { parseStaticDocumentFromXML } from '../../parse/shared/parseStaticDocumentFromXML.ts';
import { InstanceAttachmentMap } from './InstanceAttachmentMap.ts';

export type InitialInstanceStateSources = readonly [InstanceData, ...InstanceData[]];

interface InitialInstanceStateOptions {
	readonly instanceXML: string;
	readonly attachments: InstanceAttachmentMap;
}

export class InitialInstanceState {
	static async from(sources: InitialInstanceStateSources): Promise<InitialInstanceState> {
		const [instanceData] = sources;
		const instanceFile = instanceData.get(INSTANCE_FILE_NAME);
		const instanceXML = await getBlobText(instanceFile);
		const attachments = new InstanceAttachmentMap(sources);

		return new this({
			instanceXML,
			attachments,
		});
	}

	readonly document: StaticDocument;
	readonly attachments: InstanceAttachmentMap;

	private constructor(options: InitialInstanceStateOptions) {
		this.document = parseStaticDocumentFromXML(options.instanceXML);
		this.attachments = options.attachments;
	}
}
