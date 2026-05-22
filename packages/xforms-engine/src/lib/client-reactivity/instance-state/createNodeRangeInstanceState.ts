import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableParentNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableParentNode.ts';
import type { RepeatInstance } from '../../../instance/repeat/RepeatInstance.ts';

export const createNodeRangeInstanceState = (
	node: ClientReactiveSerializableParentNode<RepeatInstance>
): InstanceState => {
	return {
		get instanceXML() {
			const serializedChildren = node.currentState.children.map((child) => {
				return child.instanceState.instanceXML;
			});

			return serializedChildren.join('');
		},
	};
};
