import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';

export interface ClientReactiveSubmittableChildNode {
	readonly instanceState: InstanceState;
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
	readonly instanceState: InstanceState;
}
