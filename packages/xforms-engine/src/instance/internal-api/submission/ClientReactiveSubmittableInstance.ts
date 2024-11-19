import type { SubmissionDefinition } from '../../../client/submission/SubmissionDefinition.ts';
import type { AncestorNodeValidationState } from '../../../client/validation.ts';
import type { Root } from '../../Root.ts';
import type {
	ClientReactiveSubmittableParentNode,
	ClientReactiveSubmittableParentNodeDefinition,
} from './ClientReactiveSubmittableParentNode.ts';

interface ClientReactiveSubmittableInstanceDefinition
	extends ClientReactiveSubmittableParentNodeDefinition {
	readonly submission: SubmissionDefinition;
}

export interface ClientReactiveSubmittableInstance
	extends ClientReactiveSubmittableParentNode<Root> {
	readonly definition: ClientReactiveSubmittableInstanceDefinition;
	readonly root: Root;
	readonly parent: null;
	readonly validationState: AncestorNodeValidationState;
}
