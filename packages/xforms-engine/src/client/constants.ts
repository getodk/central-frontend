import type { ValidationTextRole } from './TextRange.ts';

export const VALIDATION_TEXT = {
	constraintMsg: 'Condition not satisfied: constraint',
	requiredMsg: 'Condition not satisfied: required',
} as const satisfies Record<ValidationTextRole, string>;

type ValidationTextDefaults = typeof VALIDATION_TEXT;

export type ValidationTextDefault<Role extends ValidationTextRole> = ValidationTextDefaults[Role];
