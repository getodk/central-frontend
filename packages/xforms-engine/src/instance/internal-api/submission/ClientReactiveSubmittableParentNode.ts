import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';

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
	readonly localName: string;
}

export interface ClientReactiveSubmittableParentNode<
	Child extends ClientReactiveSubmittableChildNode,
> {
	readonly definition: ClientReactiveSubmittableParentNodeDefinition;
	readonly parent: ClientReactiveSubmittableParentNode<ClientReactiveSubmittableChildNode> | null;
	readonly currentState: ClientReactiveSubmittableParentNodeCurrentState<Child>;
	readonly submissionState: SubmissionState;
}
