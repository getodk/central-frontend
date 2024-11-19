import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { ClientReactiveSubmittableInstance } from '../../../instance/internal-api/submission/ClientReactiveSubmittableInstance.ts';

export const createInstanceSubmissionState = (
	node: ClientReactiveSubmittableInstance
): SubmissionState => {
	return {
		get submissionXML(): string {
			return node.root.submissionState.submissionXML;
		},
	};
};
