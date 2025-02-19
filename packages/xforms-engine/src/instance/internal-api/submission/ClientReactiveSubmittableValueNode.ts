import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type {
	ClientReactiveSubmittableChildNode,
	ClientReactiveSubmittableParentNode,
} from './ClientReactiveSubmittableParentNode.ts';

interface ClientReactiveSubmittableValueNodeCurrentState {
	get relevant(): boolean;
	get instanceValue(): string;
}

export type SerializedSubmissionValue = string;

interface ClientReactiveSubmittableValueNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSubmittableValueNode {
	readonly definition: ClientReactiveSubmittableValueNodeDefinition;
	readonly parent: ClientReactiveSubmittableParentNode<ClientReactiveSubmittableChildNode>;
	readonly currentState: ClientReactiveSubmittableValueNodeCurrentState;
	readonly submissionState: SubmissionState;
}
