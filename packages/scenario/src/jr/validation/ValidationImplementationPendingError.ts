import { ImplementationPendingError } from '../../error/ImplementationPendingError.ts';

export class ValidationImplementationPendingError extends ImplementationPendingError {
	constructor() {
		super('Validation (constraint, required, etc)');
	}
}
