import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { ClientReactiveSubmittableLeafNode } from '../../../instance/internal-api/submission/ClientReactiveSubmittableLeafNode.ts';
import { escapeXMLText, serializeLeafElementXML } from '../../xml-serialization.ts';

export const createLeafNodeSubmissionState = <Value>(
	node: ClientReactiveSubmittableLeafNode<Value>
): SubmissionState => {
	return {
		get submissionXML() {
			if (!node.currentState.relevant) {
				return '';
			}

			const value = node.encodeValue(node.currentState.value);
			const xmlValue = escapeXMLText(value);

			return serializeLeafElementXML(node.definition.localName, xmlValue);
		},
	};
};
