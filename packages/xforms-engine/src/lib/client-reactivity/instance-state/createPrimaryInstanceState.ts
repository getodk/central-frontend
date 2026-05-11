import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableInstance } from '../../../instance/internal-api/serialization/ClientReactiveSerializableInstance.ts';

export const createPrimaryInstanceState = (
	node: ClientReactiveSerializableInstance
): InstanceState => {
	return {
		get instanceXML(): string {
			return node.root.instanceState.instanceXML;
		},
	};
};
