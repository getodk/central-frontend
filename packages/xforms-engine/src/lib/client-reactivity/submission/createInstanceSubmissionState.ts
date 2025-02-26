import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { ClientReactiveSubmittableInstance } from '../../../instance/internal-api/submission/ClientReactiveSubmittableInstance.ts';

export const createInstanceSubmissionState = (
	node: ClientReactiveSubmittableInstance
): InstanceState => {
	return {
		get instanceXML(): string {
			return node.root.instanceState.instanceXML;
		},
	};
};
