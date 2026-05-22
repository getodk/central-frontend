import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';

export type SerializedInstanceValue = string;

interface ClientReactiveSerializableAttributeNodeCurrentState {
	get instanceValue(): SerializedInstanceValue;
}

interface ClientReactiveSerializableAttributeNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSerializableAttributeNode {
	readonly definition: ClientReactiveSerializableAttributeNodeDefinition;
	readonly currentState: ClientReactiveSerializableAttributeNodeCurrentState;
	readonly instanceState: InstanceState;
}
