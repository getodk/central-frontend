import { ImplementationPendingError } from './ImplementationPendingError.ts';

export class ConstraintImplementationPendingError extends ImplementationPendingError {
	constructor() {
		super('constraint expressions');
	}
}
