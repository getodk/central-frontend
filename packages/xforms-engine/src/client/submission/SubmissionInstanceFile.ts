import type { SubmissionInstanceFileName, SubmissionInstanceFileType } from '../constants.ts';

// Re-export for convenient `SubmissionInstanceFile` construction/access flows
export type { SubmissionInstanceFileName, SubmissionInstanceFileType };

export interface SubmissionInstanceFile extends File {
	readonly name: SubmissionInstanceFileName;
	readonly type: SubmissionInstanceFileType;
}
