import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableValueNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableValueNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createValueNodeInstanceState = (
	node: ClientReactiveSerializableValueNode
): InstanceState => {
	const { qualifiedName } = node.definition;

	return {
		get instanceXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const xmlValue = escapeXMLText(node.currentState.instanceValue);

			return serializeLeafElementXML(qualifiedName, xmlValue);
		},
	};
};
