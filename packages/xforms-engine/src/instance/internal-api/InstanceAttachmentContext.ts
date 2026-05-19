import type { Accessor } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { InstanceAttachmentsState } from '../attachments/InstanceAttachmentsState.ts';
import type { InstanceConfig } from './InstanceConfig.ts';

interface InstanceAttachmentRootDocument {
	readonly attachments: InstanceAttachmentsState;
}

export interface InstanceAttachmentContext {
	readonly instanceConfig: InstanceConfig;
	readonly scope: ReactiveScope;
	readonly rootDocument: InstanceAttachmentRootDocument;
	readonly nodeId: FormNodeID;
	readonly instanceNode: StaticLeafElement | null;
	readonly isRelevant: Accessor<boolean>;
	readonly isAttached: Accessor<boolean>;
}
