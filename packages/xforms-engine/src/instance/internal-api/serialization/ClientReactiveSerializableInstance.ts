import type { SubmissionDefinition } from '../../../client/submission/SubmissionDefinition.ts';
import type { AncestorNodeValidationState } from '../../../client/validation.ts';
import type { Root } from '../../Root.ts';
import type {
	ClientReactiveSerializableParentNode,
	ClientReactiveSerializableParentNodeDefinition,
} from './ClientReactiveSerializableParentNode.ts';

interface ClientReactiveSerializableInstanceDefinition
	extends ClientReactiveSerializableParentNodeDefinition {
	readonly submission: SubmissionDefinition;
}

export interface ClientReactiveSerializableInstance
	extends ClientReactiveSerializableParentNode<Root> {
	readonly definition: ClientReactiveSerializableInstanceDefinition;
	readonly root: Root;
	readonly parent: null;
	readonly validationState: AncestorNodeValidationState;
}
