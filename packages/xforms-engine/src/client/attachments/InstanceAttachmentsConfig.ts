import type { InstanceAttachmentMeta } from './InstanceAttachmentMeta.ts';

export type InstanceAttachmentFileNameFactory = (meta: InstanceAttachmentMeta) => string | null;

export interface InstanceAttachmentsConfig {
	readonly fileNameFactory?: InstanceAttachmentFileNameFactory;
}
