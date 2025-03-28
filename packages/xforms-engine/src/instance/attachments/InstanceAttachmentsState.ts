import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { InstanceAttachmentMap } from '../input/InstanceAttachmentMap.ts';
import type { InstanceAttachmentContext } from '../internal-api/InstanceAttachmentContext.ts';
import type { InstanceAttachment, InstanceAttachmentRuntimeValue } from './InstanceAttachment.ts';

export class InstanceAttachmentsState extends Map<InstanceAttachmentContext, InstanceAttachment> {
	constructor(private readonly sourceAttachments: InstanceAttachmentMap | null = null) {
		super();
	}

	getInitialFileValue(instanceNode: StaticLeafElement | null): InstanceAttachmentRuntimeValue {
		if (instanceNode == null) {
			return null;
		}

		return this.sourceAttachments?.get(instanceNode.value) ?? null;
	}
}
