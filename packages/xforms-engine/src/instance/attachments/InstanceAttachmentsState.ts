import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { InstanceAttachmentMap } from '../input/InstanceAttachmentMap.ts';
import type { InstanceAttachmentContext } from '../internal-api/InstanceAttachmentContext.ts';
import type { InstanceAttachment } from './InstanceAttachment.ts';

export class InstanceAttachmentsState extends Map<InstanceAttachmentContext, InstanceAttachment> {
	constructor(private readonly sourceAttachments: InstanceAttachmentMap | null = null) {
		super();
	}

	getInitialFileValue(instanceNode: StaticLeafElement | null): Promise<File> | null {
		if (instanceNode == null) {
			return null;
		}

		return this.sourceAttachments?.get(instanceNode.value) ?? null;
	}

	retryFileValue(instanceNode: StaticLeafElement | null) {
		if (instanceNode !== null) {
			this.sourceAttachments?.retry(instanceNode.value);
		}
	}
}
