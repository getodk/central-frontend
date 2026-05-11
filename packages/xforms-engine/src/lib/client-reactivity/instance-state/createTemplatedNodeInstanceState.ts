import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableTemplatedNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableTemplatedNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createTemplatedNodeInstanceState = (
	node: ClientReactiveSerializableTemplatedNode
): InstanceState => {
	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			return serializeParentElementXML(
				node.definition.qualifiedName,
				node.currentState.children,
				node.currentState.attributes
			);
		},
	};
};
