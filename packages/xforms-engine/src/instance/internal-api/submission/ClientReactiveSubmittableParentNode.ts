import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';

export interface ClientReactiveSubmittableChildNode {
	readonly submissionState: SubmissionState;
}

interface ClientReactiveSubmittableParentNodeCurrentState<
	Child extends ClientReactiveSubmittableChildNode,
> {
	get relevant(): boolean;
	get children(): readonly Child[];
}

export interface ClientReactiveSubmittableParentNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSubmittableParentNode<
	Child extends ClientReactiveSubmittableChildNode,
> {
	readonly definition: ClientReactiveSubmittableParentNodeDefinition;
	readonly parent: ClientReactiveSubmittableParentNode<ClientReactiveSubmittableChildNode> | null;
	readonly currentState: ClientReactiveSubmittableParentNodeCurrentState<Child>;
	readonly submissionState: SubmissionState;
}
