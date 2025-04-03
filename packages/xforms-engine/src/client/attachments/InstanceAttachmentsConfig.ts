import type { InstanceAttachmentMeta } from './InstanceAttachmentMeta.ts';

export interface UpdatedInstanceAttachmentMeta extends InstanceAttachmentMeta {
	readonly writtenAt: Date;
}

export type InstanceAttachmentFileNameFactory = (
	meta: UpdatedInstanceAttachmentMeta
) => string | null;

export interface InstanceAttachmentsConfig {
	readonly fileNameFactory?: InstanceAttachmentFileNameFactory;
}
