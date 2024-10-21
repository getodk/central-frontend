import type {
	SubmissionInstanceFile,
	SubmissionInstanceFileName,
} from './SubmissionInstanceFile.ts';

export interface SubmissionData extends FormData {
	get(name: SubmissionInstanceFileName): SubmissionInstanceFile;
	get(name: string): FormDataEntryValue | null;

	has(name: SubmissionInstanceFileName): true;
	has(name: string): boolean;
}
