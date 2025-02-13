import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { Root } from '../../../instance/Root.ts';
import { serializeParentElementXML } from '../../xml-serialization.ts';

export const createRootSubmissionState = (node: Root): SubmissionState => {
	return {
		get submissionXML() {
			const { namespaceDeclarations, attributes } = node.definition;
			const serializedChildren = node.currentState.children.map((child) => {
				return child.submissionState.submissionXML;
			});

			return serializeParentElementXML(node.definition.localName, serializedChildren, {
				namespaceDeclarations,
				attributes,
			});
		},
	};
};
