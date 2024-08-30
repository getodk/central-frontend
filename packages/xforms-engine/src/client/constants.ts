import type { ValidationTextRole } from './TextRange.ts';

export const VALIDATION_TEXT = {
	constraintMsg: 'Condition not satisfied: constraint',
	requiredMsg: 'Condition not satisfied: required',
} as const satisfies Record<ValidationTextRole, string>;

type ValidationTextDefaults = typeof VALIDATION_TEXT;

export type ValidationTextDefault<Role extends ValidationTextRole> = ValidationTextDefaults[Role];

export const SUBMISSION_INSTANCE_FILE_NAME = 'xml_submission_file';
export type SubmissionInstanceFileName = typeof SUBMISSION_INSTANCE_FILE_NAME;

export const SUBMISSION_INSTANCE_FILE_TYPE = 'text/xml';
export type SubmissionInstanceFileType = typeof SUBMISSION_INSTANCE_FILE_TYPE;
