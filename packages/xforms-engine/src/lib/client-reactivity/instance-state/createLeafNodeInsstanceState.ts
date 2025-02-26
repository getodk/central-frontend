import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableLeafNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableLeafNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createLeafNodeInsstanceState = <Value>(
	node: ClientReactiveSerializableLeafNode<Value>
): InstanceState => {
	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const value = node.encodeValue(node.currentState.value);
			const xmlValue = escapeXMLText(value);

			return serializeLeafElementXML(node.definition.qualifiedName, xmlValue);
		},
	};
};
