import type { SubmissionMeta } from '../../../client/submission/SubmissionMeta.ts';
import type { AncestorNodeValidationState } from '../../../client/validation.ts';
import type { InstanceAttachmentsState } from '../../attachments/InstanceAttachmentsState.ts';
import type { Root } from '../../Root.ts';
import type {
	ClientReactiveSerializableParentNode,
	ClientReactiveSerializableParentNodeDefinition,
} from './ClientReactiveSerializableParentNode.ts';

interface ClientReactiveSerializableInstanceDefinition
	extends ClientReactiveSerializableParentNodeDefinition {
	readonly submission: SubmissionMeta;
}

export interface ClientReactiveSerializableInstance
	extends ClientReactiveSerializableParentNode<Root> {
	readonly definition: ClientReactiveSerializableInstanceDefinition;
	readonly root: Root;
	readonly parent: null;
	readonly attachments: InstanceAttachmentsState;
	readonly validationState: AncestorNodeValidationState;
}
