import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSerializableAttributeNode } from '../../../instance/internal-api/serialization/ClientReactiveSerializableAttributeNode.ts';
import { escapeXMLText, serializeAttributeXML } from '../../xml-serialization.ts';

export const createAttributeNodeInstanceState = (
	node: ClientReactiveSerializableAttributeNode
): InstanceState => {
	const { qualifiedName } = node.definition;

	return {
		get instanceXML() {
			const xmlValue = escapeXMLText(node.currentState.instanceValue, true);
			return serializeAttributeXML(qualifiedName, xmlValue);
		},
	};
};
