import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';

export interface ClientReactiveSerializableChildNode {
	readonly instanceState: InstanceState;
}

export interface ClientReactiveSerializableParentNodeCurrentState<
	Child extends ClientReactiveSerializableChildNode,
> {
	get relevant(): boolean;
	get children(): readonly Child[];
}

export interface ClientReactiveSerializableParentNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSerializableParentNode<
	Child extends ClientReactiveSerializableChildNode,
> {
	readonly definition: ClientReactiveSerializableParentNodeDefinition;
	readonly parent: ClientReactiveSerializableParentNode<ClientReactiveSerializableChildNode> | null;
	readonly currentState: ClientReactiveSerializableParentNodeCurrentState<Child>;
	readonly instanceState: InstanceState;
}
