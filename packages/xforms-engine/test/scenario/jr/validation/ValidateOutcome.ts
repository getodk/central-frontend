import type { AnyViolation } from '@getodk/xforms-engine';
import type { AnyPositionalEvent } from '../event/getPositionalEvents.ts';

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
	readonly outcome: ValidationOutcomeStatus;

	constructor(
		readonly failedPrompt: AnyPositionalEvent | null,
		violation: AnyViolation | null
	) {
		switch (violation?.condition) {
			case 'constraint':
				this.outcome = 'ANSWER_CONSTRAINT_VIOLATED';
				break;

			case 'required':
				this.outcome = 'ANSWER_REQUIRED_BUT_EMPTY';
				break;

			default:
				this.outcome = 'ANSWER_OK';
		}
	}
}
