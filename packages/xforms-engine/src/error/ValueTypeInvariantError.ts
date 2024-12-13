import type { ValueType } from '../client/ValueType.ts';
import { ErrorProductionDesignPendingError } from './ErrorProductionDesignPendingError.ts';

/**
 * Temporary(?) representation of error conditions arising from violation of
 * invariants specific to {@link valueType}.
 *
 * @todo The intent of this distinct subclass of
 * {@link ErrorProductionDesignPendingError} is to call out cases where we may
 * want to represent such errors to clients as **validation errors** in the
 * future. We identified this as probably desirable in the initial work on `int`
 * and `decimal` value types, but held off on that aspect of implementation to
 * tame scope.
 */
export class ValueTypeInvariantError extends ErrorProductionDesignPendingError {
	constructor(
		readonly valueType: ValueType,
		message: string
	) {
		super(`(${valueType}) ${message}`);
	}
}
