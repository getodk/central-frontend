import type { AnyPositionalEvent } from '../event/getPositionalEvents.ts';
import { ValidationImplementationPendingError } from './ValidationImplementationPendingError.ts';

export const ANSWER_OK = 'ANSWER_OK';
export const ANSWER_REQUIRED_BUT_EMPTY = 'ANSWER_REQUIRED_BUT_EMPTY';
export const ANSWER_CONSTRAINT_VIOLATED = 'ANSWER_CONSTRAINT_VIOLATED';

const ValidationOutcomeStatus = {
	ANSWER_OK,
	ANSWER_REQUIRED_BUT_EMPTY,
	ANSWER_CONSTRAINT_VIOLATED,
} as const;

type ValidationOutcomeStatuses = typeof ValidationOutcomeStatus;

type ValidationOutcomeStatus = ValidationOutcomeStatuses[keyof ValidationOutcomeStatuses];

/**
 * @todo
 */
export class ValidateOutcome {
	get failedPrompt(): AnyPositionalEvent | null {
		throw new ValidationImplementationPendingError();
	}

	get outcome(): ValidationOutcomeStatus {
		throw new ValidationImplementationPendingError();
	}
}
