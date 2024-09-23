import type { RootNode } from '../RootNode.ts';

export interface SubmissionState {
	/**
	 * Represents the serialized XML state of a given node, as it will be prepared
	 * for submission. The value produced in {@link RootNode.submissionState} is
	 * the same serialization which will be produced for the complete submission.
	 *
	 * @todo Note that this particular aspect of the design doesn't yet address
	 * production of unique file names. As such, this may change as we introduce
	 * affected data types (and their supporting nodes).
	 */
	get submissionXML(): string;
}
