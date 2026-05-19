import type { FormNodeID } from '../identity.ts';

export type InstanceAttachmentExtension = `.${string}`;

export interface InstanceAttachmentMeta {
	readonly nodeId: FormNodeID;
	readonly writtenAt: Date | null;
	readonly basename: string;
	readonly extension: InstanceAttachmentExtension | null;
}
