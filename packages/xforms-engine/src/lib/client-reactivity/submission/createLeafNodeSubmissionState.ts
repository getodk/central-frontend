import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSubmittableLeafNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableLeafNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createLeafNodeSubmissionState = <Value>(
	node: ClientReactiveSubmittableLeafNode<Value>
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
