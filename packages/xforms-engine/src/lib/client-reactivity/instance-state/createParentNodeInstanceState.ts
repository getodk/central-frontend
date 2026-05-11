import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { GeneralChildNode } from '../../../instance/hierarchy.ts';
import type { ClientReactiveSerializableParentNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableParentNode.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createParentNodeInstanceState = (
	node: ClientReactiveSerializableParentNode<GeneralChildNode>
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
