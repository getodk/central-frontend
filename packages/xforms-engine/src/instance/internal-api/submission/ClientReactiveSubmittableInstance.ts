import type { SubmissionDefinition } from '../../../client/submission/SubmissionDefinition.ts';
import type { AncestorNodeValidationState } from '../../../client/validation.ts';
import type { GeneralChildNode } from '../../hierarchy.ts';
import type {
	ClientReactiveSubmittableParentNode,
	ClientReactiveSubmittableParentNodeDefinition,
} from './ClientReactiveSubmittableParentNode.ts';

interface ClientReactiveSubmittableInstanceDefinition
	extends ClientReactiveSubmittableParentNodeDefinition {
	readonly submission: SubmissionDefinition;
}

export interface ClientReactiveSubmittableInstance
	extends ClientReactiveSubmittableParentNode<GeneralChildNode> {
	readonly definition: ClientReactiveSubmittableInstanceDefinition;
	readonly parent: null;
	readonly validationState: AncestorNodeValidationState;
}
